# Glossary Schema Reference

## File Locations
- JSON: `glossary/glossary.json`
- CSV: `glossary/glossary.csv`

## Entry Structure

```json
{
  "zh": "中文文本",
  "en": "English Translation",
  "id": "5010000",
  "category": "cash",
  "fieldType": "name",
  "source": "String.wz\\Cash.img.xml"
}
```

## Categories (Entity Types)

| Category | Description | Examples |
|----------|-------------|----------|
| cash | Cash shop items/effects | 太阳效果, 小恶魔效果 |
| consume | Consumable items | 药水, 食物 |
| equipment | Equipment/gear | 武器, 防具 |
| etc | Miscellaneous items | 材料, 碎片 |
| map | Map/location names | 地图名称 |
| mob | Monster names | 怪物名 |
| monsterbook | Monster Book entries | 怪物图鉴 |
| npc | NPC names/dialogue |  NPC名称 |
| pet | Pet names/items | 宠物相关 |
| skill | Skill names/effects | 技能名称 |
| tooltip | Tooltip text | 说明文本 |

## Field Types

| FieldType | Description |
|-----------|-------------|
| name | Short name (item, skill, NPC, etc.) |
| desc | Description text |
| Title | Title text |
| mapName | Map name |
| mapDesc | Map description |
| quest00 | Quest-related text |
| boss00 | Boss-related text |
| help0 | Help text |
| func | Function/effect description |
| bookName | Monster book entry name |
| streetName | Street name |

## ID Patterns

- **Numeric IDs**: e.g., `5010000` - Used for cash items, skills, maps, mobs, NPCs
- **WZ paths**: e.g., `Cash.img` - Used for some cash item references
- **Format**: `String.wz\<File>.img.xml` - Source file reference

## Usage Examples

### Search for a skill by name
```bash
python scripts/glossary_lookup.py "冒险" --category skill --field-type name
```

### Search for item descriptions
```bash
python scripts/glossary_lookup.py "药水" --category consume --field-type desc
```

### Find all entries from a specific WZ file
```python
entries = [e for e in glossary['entries'] if 'Cash.img' in e.get('source', '')]
```

### Find entries by numeric ID prefix
```python
entries = [e for e in glossary['entries'] if str(e.get('id', '')).startswith('501')]
```
