---
description: ending a session
---

// turbo-all

# End Session

1. Update project documents
   - Ensure all relevant files in `.agent/docs` are up to date.
   - Include architecture changes, ADRs, runbooks, specs, and any new notes.

2. Update `.agent\AG_CONTEXT.md`
   - Use the template located at:
     `.agent\templates\template-AG_CONTEXT.md`
   - Edit `.agent\AG_CONTEXT.md` using the template.
   - Make sure all new session information is included.

3. Clean up `.agent\AG_CONTEXT.md`
   - Organize information in **logical or chronological order** within each section.
   - Remove any outdated or irrelevant information.
   - Ensure clarity and consistency for the next session.
   - Clean up temp files in `.agent/temp`

4. Stop all background processes
   - Terminate any running scripts, agents, or temporary tasks initiated during the session.

5. Report back to the user
   - Summarize updates to documentation.
   - Highlight any unresolved issues or next steps.
   - Confirm that all processes have been stopped and context is saved.