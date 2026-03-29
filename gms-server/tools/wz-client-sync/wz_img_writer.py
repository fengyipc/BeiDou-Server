"""
Encode HaRepacker-style WZ XML (imgdir/string/int/...) into a standalone GMS classic .img blob.

Binary layout matches MapleLib WzImage.SaveImage / WzBinaryWriter (GMS IV + default user key).
Sufficient for wz-zh-CN overlays that contain only scalar nodes and nested imgdirs (no canvas/sound).
"""

from __future__ import annotations

import io
import struct
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import BinaryIO

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

MAPLESTORY_KEY_DEFAULT = [
    0x13,
    0x00,
    0x00,
    0x00,
    0x52,
    0x00,
    0x00,
    0x00,
    0x2A,
    0x00,
    0x00,
    0x00,
    0x5B,
    0x00,
    0x00,
    0x00,
    0x08,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x00,
    0x00,
    0x10,
    0x00,
    0x00,
    0x00,
    0x60,
    0x00,
    0x00,
    0x00,
    0x06,
    0x00,
    0x00,
    0x00,
    0x02,
    0x00,
    0x00,
    0x00,
    0x43,
    0x00,
    0x00,
    0x00,
    0x0F,
    0x00,
    0x00,
    0x00,
    0xB4,
    0x00,
    0x00,
    0x00,
    0x4B,
    0x00,
    0x00,
    0x00,
    0x35,
    0x00,
    0x00,
    0x00,
    0x05,
    0x00,
    0x00,
    0x00,
    0x1B,
    0x00,
    0x00,
    0x00,
    0x0A,
    0x00,
    0x00,
    0x00,
    0x5F,
    0x00,
    0x00,
    0x00,
    0x09,
    0x00,
    0x00,
    0x00,
    0x0F,
    0x00,
    0x00,
    0x00,
    0x50,
    0x00,
    0x00,
    0x00,
    0x0C,
    0x00,
    0x00,
    0x00,
    0x1B,
    0x00,
    0x00,
    0x00,
    0x33,
    0x00,
    0x00,
    0x00,
    0x55,
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x09,
    0x00,
    0x00,
    0x00,
    0x52,
    0x00,
    0x00,
    0x00,
    0xDE,
    0x00,
    0x00,
    0x00,
    0xC7,
    0x00,
    0x00,
    0x00,
    0x1E,
    0x00,
    0x00,
    0x00,
]

MAPLESTORY_GMS_IV = bytes([0x4D, 0x23, 0xC7, 0x2B])

WZ_HEADER_WITHOUT_OFFSET = 0x73
WZ_HEADER_WITH_OFFSET = 0x1B


class WzCryptoKey:
    """Expanding key stream (dustinlieu/wz Key, matches MapleLib WzKeyGenerator)."""

    def __init__(self, iv: bytes, key_material: list[int]) -> None:
        self._cipher_stream = bytearray()
        aes_key = bytearray(32)
        for i in range(0, 128, 16):
            aes_key[i // 4] = key_material[i]
        self._encryptor = Cipher(algorithms.AES(bytes(aes_key)), modes.ECB()).encryptor()
        self._iv = iv

    def at(self, i: int) -> int:
        while len(self._cipher_stream) <= i:
            block_index = len(self._cipher_stream) // 16
            if block_index == 0:
                block = bytearray(16)
                for j in range(16):
                    block[j] = self._iv[j % 4]
            else:
                block = self._cipher_stream[-16:]
            self._cipher_stream.extend(self._encryptor.update(bytes(block)))
        return self._cipher_stream[i]


@dataclass
class WzBinaryWriter:
    stream: BinaryIO
    wz_key: WzCryptoKey
    string_cache: dict[str, int] = field(default_factory=dict)
    # MapleLib ReadStringBlock uses (imgBase + stored_int); stored_int = absPos - imgBase
    img_data_base: int = 0

    def write_u8(self, v: int) -> None:
        self.stream.write(bytes([v & 0xFF]))

    def write_u16(self, v: int) -> None:
        self.stream.write(struct.pack("<H", v & 0xFFFF))

    def write_i32(self, v: int) -> None:
        self.stream.write(struct.pack("<i", v))

    def write_f32(self, v: float) -> None:
        self.stream.write(struct.pack("<f", v))

    def write_f64(self, v: float) -> None:
        self.stream.write(struct.pack("<d", v))

    def write_compressed_int(self, value: int) -> None:
        if value > 127 or value < -128:
            self.stream.write(struct.pack("<b", -128))
            self.stream.write(struct.pack("<i", value))
        else:
            self.stream.write(struct.pack("<b", value))

    def write_plain_wz_string(self, value: str) -> None:
        """MapleLib WzBinaryWriter.Write(string) — length-prefixed encrypted payload."""
        if not value:
            self.write_u8(0)
            return
        unicode_mode = any(ord(c) > 127 for c in value)
        if unicode_mode:
            mask = 0xAAAA
            ln = len(value)
            if ln >= 127:
                self.write_u8(127)
                self.write_i32(ln)
            else:
                self.write_u8(ln)
            for i, ch in enumerate(value):
                c = ord(ch) & 0xFFFF
                c ^= (self.wz_key.at(i * 2 + 1) << 8) + self.wz_key.at(i * 2)
                c ^= (mask + i) & 0xFFFF
                self.stream.write(struct.pack("<H", c))
        else:
            mask = 0xAA
            ln = len(value)
            if ln > 127:
                self.stream.write(struct.pack("<b", -128))
                self.write_i32(ln)
            else:
                self.stream.write(struct.pack("<b", -ln))
            for i, ch in enumerate(value):
                b = ord(ch) & 0xFF
                b ^= self.wz_key.at(i)
                b ^= (mask + i) & 0xFF
                self.stream.write(bytes([b]))

    def write_string_value(self, s: str, without_offset: int, with_offset: int) -> None:
        """MapleLib WriteStringValue — name/header strings with optional offset cache."""
        if len(s) > 4 and s in self.string_cache:
            self.write_u8(with_offset & 0xFF)
            rel = self.string_cache[s] - self.img_data_base
            self.write_i32(rel)
        else:
            self.write_u8(without_offset & 0xFF)
            pos = self.stream.tell()
            self.write_plain_wz_string(s)
            if len(s) > 4 and s not in self.string_cache:
                self.string_cache[s] = pos

    def write_property_name(self, name: str) -> None:
        self.write_string_value(name, 0x00, 0x01)

    def write_extended_wrapper(self, inner_write) -> None:
        """byte 9 + length placeholder + payload; length = bytes after placeholder, minus 4."""
        self.write_u8(9)
        before = self.stream.tell()
        self.write_i32(0)
        inner_write()
        end = self.stream.tell()
        length_field = end - before - 4
        self.stream.seek(before)
        self.write_i32(length_field)
        self.stream.seek(end)


def _encode_property_list(writer: WzBinaryWriter, children: list[ET.Element]) -> None:
    writer.write_u16(0)
    writer.write_compressed_int(len(children))
    for el in children:
        name = el.attrib.get("name", "")
        tag = _local_tag(el)
        writer.write_property_name(name)
        if tag == "imgdir":
            writer.write_extended_wrapper(lambda: _encode_sub_property(writer, el))
        elif tag == "string":
            val = el.attrib.get("value", "")
            writer.write_u8(8)
            writer.write_string_value(val, 0, 1)
        elif tag == "int":
            writer.write_u8(3)
            writer.write_compressed_int(int(el.attrib.get("value", "0")))
        elif tag == "short":
            writer.write_u8(2)
            writer.stream.write(struct.pack("<h", int(el.attrib.get("value", "0"))))
        elif tag == "float":
            writer.write_u8(4)
            v = float(el.attrib.get("value", "0"))
            if v == 0.0:
                writer.write_u8(0)
            else:
                writer.write_u8(0x80)
                writer.write_f32(v)
        elif tag == "double":
            writer.write_u8(5)
            writer.write_f64(float(el.attrib.get("value", "0")))
        elif tag == "null":
            writer.write_u8(0)
        elif tag == "vector":
            writer.write_extended_wrapper(
                lambda: _encode_vector(writer, int(el.attrib["x"]), int(el.attrib["y"]))
            )
        else:
            raise UnsupportedXmlNode(tag)


def _encode_vector(writer: WzBinaryWriter, x: int, y: int) -> None:
    writer.write_string_value("Shape2D#Vector2D", WZ_HEADER_WITHOUT_OFFSET, WZ_HEADER_WITH_OFFSET)
    writer.write_compressed_int(x)
    writer.write_compressed_int(y)


def _encode_sub_property(writer: WzBinaryWriter, imgdir_el: ET.Element) -> None:
    writer.write_string_value("Property", WZ_HEADER_WITHOUT_OFFSET, WZ_HEADER_WITH_OFFSET)
    kids = [c for c in list(imgdir_el) if isinstance(c.tag, str)]
    _encode_property_list(writer, kids)


def _local_tag(el: ET.Element) -> str:
    if el.tag.startswith("{"):
        return el.tag.rsplit("}", 1)[-1]
    return el.tag


class UnsupportedXmlNode(ValueError):
    pass


def xml_bytes_contain_unsupported(xml_bytes: bytes) -> list[str]:
    """Return list of unsupported local tag names present in XML (excluding root)."""
    root = ET.fromstring(xml_bytes)
    bad: set[str] = set()
    supported = frozenset(
        {"imgdir", "string", "int", "short", "float", "double", "null", "vector"}
    )
    for el in root.iter():
        if el is root:
            continue
        t = _local_tag(el)
        if t not in supported:
            bad.add(t)
    return sorted(bad)


def encode_img_xml_to_bytes(xml_bytes: bytes) -> bytes:
    root = ET.fromstring(xml_bytes)
    if _local_tag(root) != "imgdir":
        raise ValueError("root element must be <imgdir name=\"....\">")
    buf = io.BytesIO()
    key = WzCryptoKey(MAPLESTORY_GMS_IV, MAPLESTORY_KEY_DEFAULT)
    writer = WzBinaryWriter(buf, key, string_cache={})

    def write_root() -> None:
        writer.write_string_value("Property", WZ_HEADER_WITHOUT_OFFSET, WZ_HEADER_WITH_OFFSET)
        kids = [c for c in list(root) if isinstance(c.tag, str)]
        _encode_property_list(writer, kids)

    write_root()
    return buf.getvalue()


def encode_img_xml_file(path) -> bytes:
    return encode_img_xml_to_bytes(path.read_bytes())
