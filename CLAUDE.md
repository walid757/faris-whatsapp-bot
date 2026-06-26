# STRICT RULES — ALWAYS FOLLOW

## THE GOLDEN RULE
When adding anything new: ADD ONLY. Never remove or modify existing code.

## FORBIDDEN — NO EXCEPTIONS:
- Do NOT delete any line
- Do NOT rewrite existing functions
- Do NOT refactor or "clean up" old code
- Do NOT modify anything I didn't ask about
- Do NOT shorten arrays or lists — if original has 3 items, keep all 3
- Before changing any array/list, write the original values first, then show what you're adding

## HOW TO ADD NEW FEATURES:
- Append new functions at the bottom of the file
- Add new cases inside existing if/switch WITHOUT changing other cases

## IF YOU ARE UNSURE:
Ask me what to add and where — then add ONLY there.

## AUTOMATIC RULE:
At the END of every session, automatically update the 
PROJECT MEMORY section in this file with:
- What was tried and failed
- What worked
- Current project status

## PROJECT MEMORY:
- Tried: (Claude fills this)
- Worked: (Claude fills this)
- Status: (Claude fills this)

## TESTING RULE:
Before any change, verify existing functionality still works.
Never remove existing tests.

## CHANGELOG RULE:
After every change, add one line to CHANGELOG.md:
- Date + what was added/changed

## SECURITY RULE:
Never write API keys or passwords directly in code.
Always use process.env variables.
Never log sensitive user data.

## CODE STYLE RULE:
Follow the exact same style as existing code.
If code is minified, keep it minified.
If code is normal, keep it normal.
Never reformat existing code.

## DEPENDENCIES RULE:
Never install a new npm package without asking me first.