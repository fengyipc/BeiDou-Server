---
name: gmlingua
description: |
  This skill should be used when translating game text for the MapleStory private server project,
  particularly for looking up terminology in the glossary (glossary.json/glossary.csv).
  It provides workflow guidance for leveraging the 14,000+ term glossary to find optimal translations
  for game-related nouns, skills, items, NPCs, maps, and other in-game entities.
  Trigger scenarios: user asks to translate game text, improve translation quality, find terminology consistency.
---

# GM Lingua - MapleStory Game Text Translation Skill

This skill helps translate game text by leveraging the project's terminology glossary containing 14,000+ Chinese-English translation pairs.

## Glossary Data Structure

The glossary provides structured translation entries with the following fields:
- `zh`: Chinese text
- `en`: English translation
- `id`: Unique identifier (numeric ID or wz path like "Cash.img")
- `category`: Entity type: `cash`, `consume`, `equipment`, `etc`, `map`, `mob`, `monsterbook`, `npc`, `pet`, `skill`, `tooltip`
- `fieldType`: Field purpose: `name`, `desc`, `Title`, `mapName`, `mapDesc`, `quest00`, `boss00`, `help0`, `func`, `bookName`, etc.
- `source`: WZ file path (e.g., `String.wz\Cash.img.xml`)

## Translation Workflow

### Step 1: Analyze Input Text

When given text to translate, first analyze:
1. **Detect category**: Is it a skill name, item name, NPC dialogue, map name, monster name, quest description, etc.?
2. **Extract potential IDs**: Look for numeric IDs (e.g., `5010000`) or wz paths in the context
3. **Identify text type**: `name` (short names), `desc` (descriptions), `Title`, `help0`, `quest00`, etc.

### Step 2: Search Glossary

Use the provided `glossary_lookup.py` script to search the glossary:

```bash
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py <search_term> [--category <cat>] [--field-type <ft>] [--limit <n>]
```

Search priority:
1. **Exact ID match**: If numeric ID or wz path is known, search by ID first
2. **Text match**: Search Chinese text for exact or partial matches
3. **English reverse lookup**: If English is partially known, search English field
4. **Category filter**: Filter by category when the entity type is known
5. **Field type filter**: Filter by field type (name/desc) when applicable

### Step 3: Evaluate and Rank Results

When multiple matches exist, prioritize by:
1. **Exact match** (highest confidence)
2. **Same category** match
3. **Same field type** match
4. **Same source file** match
5. **Fuzzy match** with similarity scoring

### Step 4: Apply Translation

For nouns/terminology:
- Prefer glossary terms when available
- Maintain consistency with existing translations
- Consider context (item vs skill vs NPC names have different naming conventions)

For descriptions:
- Keep translation concise and natural
- Preserve formatting tokens if present (`\n`, `{0}`, `{1}`, etc.)
- Match the tone of existing translations

## Example Lookups

```bash
# Search by numeric ID
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py 5010000

# Search Chinese text
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py "太阳效果"

# Search with category filter
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py "Maple" --category skill

# Search with field type filter
python .codebuddy/skills/gmlingua/scripts/glossary_lookup.py "怪物" --field-type name
```

## Helper Scripts

- `scripts/glossary_lookup.py`: Main lookup script with multi-mode search
- `references/glossary_schema.md`: Detailed glossary structure documentation
