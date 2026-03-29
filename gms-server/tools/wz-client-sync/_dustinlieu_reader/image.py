import io

from .binary_reader import BinaryReader
from .property import Property, parse_object


def load_image_from_bytes(data: bytes, key, img_data_base: int = 0):
	reader = BinaryReader(io.BytesIO(data), key, img_data_base=img_data_base)
	img_type = reader.read_uint_8()
	if img_type == 0x01:
		return None
	if img_type == 0x73:
		return parse_object(reader)
	return None


def load_image_from_file(path, key, img_data_base: int = 0):
	file = open(path, mode="rb")
	reader = BinaryReader(file, key, img_data_base=img_data_base)

	img_type = reader.read_uint_8()
	if img_type == 0x01:
		# TODO
		return None
	elif img_type == 0x73:
		return parse_object(reader)