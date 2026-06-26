# DP Creative OS — Production Workflow

The platform enforces a strict, hierarchical production workflow.

## The Pipeline

1. **Script Studio**: 
   - The genesis of the project.
   - Extract raw text into structured Script Elements (Action, Dialogue).
   - *Requirement*: Script must be marked "Locked" to proceed.
   
2. **Storyboard**: 
   - Converts the locked Script into physical Scenes.
   - Each Scene can contain multiple Shots.

3. **Scene Workspace / Shot List**: 
   - Producers break down each Scene into exact camera angles (Shots).
   - They specify requirements (Lighting, VFX, Characters).

4. **Prompt Studio**: 
   - The AI Artist takes the Shot Requirements and drafts the technical Prompt Sets.
   - Includes positive prompts, negative prompts, and aspect ratios.

5. **Generation Studio**: 
   - The workspace where generation occurs.
   - **Auto-Injection**: The system intercepts the manual prompt, queries the Creative Graph, and prepends active Creative Memories (Characters, Brands) invisibly before sending to the Provider.

6. **Asset Library**: 
   - Returned assets land here.
   - Producers review, approve, or reject assets.
   - Approving an asset ripples up the Progress Engine, marking the Shot, Scene, and Project closer to 100% completion.

## The Progress Engine

The `WorkflowEngine.ts` automatically recursively evaluates completion:
- A Shot is 100% when its active Asset is "Approved".
- A Scene is 100% when all its Shots are 100%.
- A Project is 100% when all its Scenes are 100%.
