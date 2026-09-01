# Home Gym Creator — landing page

> Updated: 31 August 2026. Process-first hackathon introduction, not a sales page or
> a walkthrough of the bundled demo. Copy, section order, mobile layout and guarded project entry
> are implemented locally; public-build acceptance is tracked in the [submission plan](../plans/phase-28-submission.md).
> The labeled hero concept was added on 31 August 2026. Current product captures and a possible
> recording remain in the [landing plan](../plans/phase-25-landing-polish.md).

## Visual reference

![Accepted process-first landing reference](./mockups/home-gym-landing-page-v2.png)

[Reference provenance and generation brief](./mockups/home-gym-landing-page-v2.md).
The reference establishes layout, hierarchy and style; this specification governs behavior and copy.
Generated editor views, controls and status labels are illustrative, not implementation evidence.
The earlier v1 reference is historical and is not the implementation target.
Keep the product's dumbbell brand mark and the full-color landing imagery. Use the reference's
editorial proportions and restrained technical accents, but do not add decorative measurement
frames or dimension labels around the hero and process images.

## Page goal

Explain the real problem: choosing equipment for a user's exercises, arranging it in their available
room with obstacles and exercise clearance, and keeping the complete set within budget.
Explain shared editing in the hero, then the process from scratch and a concrete human–agent
handoff before the agent setup instructions.
The prepared demo is an optional shortcut to a result, not the narrative of the page.

Use English throughout. The shared visual system uses warm off-white and stone surfaces, near-black
type and controls, restrained signal-red accents, fine neutral rules and low black shadows. Primary
actions are near-black with a red edge; secondary actions stay light and outlined. Reserve green,
amber and deeper red for success, warning and error meaning so validation remains unambiguous.
Avoid sales sections, pricing plans, testimonials, fake endorsements and a dominant catalog
presentation.

## Page structure and copy

### 1. Hero

Headline:

> What to buy. Where it fits.

Description:

> Plan your home gym with an AI agent. Edit the same room together, while the app checks space and budget.

Primary CTA: **Start planning**. Secondary CTA: **Explore sample project**.
Supporting copy beside the actions: **AI planning needs an external agent in a WebMCP-capable
environment.** Include an **Agent guide** link to `/#agent-guide` and the visible manual alternative:
**Prefer to work manually? The editor works without an agent.**
The compact saved-project note links **Open creator** to resume; replacement protection lives at
the creator entry boundary, not in landing-only click handlers.

Use the user-provided AI-generated small-room concept as the emotional preview. Label it visibly as
illustrative and not an app render; it is not evidence of automatic reconstruction, geometry checks
or safety certification. Real creator evidence begins in **How it works** below. No separate sample
statistics strip, prescribed room dimensions, equipment count, fixed budget or demo scenario section.

### 2. How it works

Anchor: `how-it-works`. Heading: **From an empty room to your home gym.**
Subline: **Start with your space. Build the plan together.**

1. **Create your room** — Set your room dimensions and obstacles, or ask your agent to help from
   a description or photo.
2. **Set your goals and budget** — Choose your training goals, preferred exercises and spending limit.
3. **Choose and arrange equipment** — Choose equipment together. The agent arranges it, and the
   app checks space and cost.

One note below the steps: **Using a photo? Share it with your external agent, not the editor.
Provide reference measurements and review the model.**

Illustrate the same room and fixed obstacles across all three steps: empty geometry, goals/budget,
then furnished layout. Steps 1 and 3 use captures/crops of real product states. Step 2 uses the
clearly symbolic editorial goals/budget overlay requested on 1 September 2026; it must not be
presented as product controls. This is a conceptual sequence, not a new mandatory wizard.

A photo goes to the external agent; do not imply built-in photo upload or accurate automatic
reconstruction. The agent can gather several inputs in one exchange or ask for missing ones.

### 3. Shared editing

Heading: **You edit. The agent continues.**
Introduction: **Move a piece of equipment. Your agent picks up from the room as it is now.**

- Move equipment yourself.
- The agent reads your change and adapts the layout.
- Review the checks. Undo any change.

Example follow-up: **Keep the rack here. Adjust the rest of the layout.**
Caption: **One shared room model, whether you or the agent makes the change.**
Present the handoff as a compact three-step flow without an editor capture: the user changes the
room, the room stays shared, and the agent continues. Directional cues are explanatory artwork,
not a claim that an activity feed or path visualization exists in the product.

### 4. Agent guide

Anchor: `agent-guide`. Heading: **Let your agent guide you.**

> Start a conversation. Your agent asks for the room details, training goals and budget it needs.

Always-visible clarification: **Use your external agent on the open creator page. There is no
in-app chatbot.** Do not hide this condition inside the setup disclosure.

Always-visible, selectable starter prompt with a **Copy prompt** button:

Use the concise prompt exported as `STARTER_PROMPT` in
[`src/components/landing/landing-content.ts`](../src/components/landing/landing-content.ts). It must:

- tell the agent to collaborate through Home Gym Creator's WebMCP tools,
- ask for a room photo or description, dimensions and fixed obstacles,
- create an approximate room model and obtain approval before equipment selection,
- collect goals, exercises, routine, budget and anchoring preferences,
- exclude existing-equipment intake and protective-flooring planning until those capabilities exist,
- ask for the missing information before choosing and placing equipment.

Instructions:

> Paste this into your agent's chat while the creator is open.

Provide a short inline **Agent setup guide** disclosure here (no separate route). Describe copying
the prompt, opening **Start planning**, and using the external agent on that same creator page/session.
Include concise, freshly verified environment setup guidance with official source links. Do not
hard-code unverified browser/model versions or imply tools register on `/`.
There is no in-app chatbot or automatic agent launch.

Keep copying before navigation in the instruction sequence. Mention confirmation before replacing
a saved project and offer **Open creator** to continue it. Manual setup uses **Room → Room dimensions**
and **Project → Settings**. The manual alternative is already visible in the hero.
Copying must not navigate or start a project. Announce success accessibly only when copying succeeds;
on failure or an unavailable Clipboard API, keep the prompt selectable and explain manual copying.

### 5. WebMCP explanation

Eyebrow: **Powered by WebMCP**. Heading: **AI plans. The application checks.**

**Read the room → Edit through WebMCP → Check geometry and budget**

> Geometry checks come from the app. Your agent explains the results and helps you weigh the trade-offs.

Agent tools apply changes to the same model as manual editing, with shared undo/redo. Do not copy
the generated mockup's inaccurate claim that a separate user must apply proposed agent changes.
The deterministic engine checks geometry; the agent interprets results and trade-offs.

### 6. Closing actions and footer

Heading: **Ready to plan your space?**
Primary **Start planning**; secondary **Explore sample project**.
Reuse the shared footer with prototype identification and a verified public **Repository** link.
The implementation omits that link while the configured URL returns logged-out HTTP 404;
confirm public access before adding it. This remains a release gate, not a placeholder link.
Note: **Fictional equipment catalog. Simplified geometry. Not a professional safety assessment.**
No fabricated demo-video link or extra promotional section.

## Navigation and destinations

| Element | Destination |
| --- | --- |
| Start planning | `/creator?start=new` |
| Explore sample project | `/creator?start=demo` |
| Open creator | `/creator` |
| How it works | `/#how-it-works` |
| Agent guide | `/#agent-guide` |
| Catalog | `/catalog` |
| Logo | `/` |

Header order: How it works, Agent guide, Catalog, then the existing Open creator action.
The inline Agent setup guide opens its local disclosure; it is not another empty anchor.
Anchor targets must stay visible below the sticky header. At narrow widths keep in-page paths to
both guidance sections available even if the shared desktop navigation is hidden.

Explicit `new` and `demo` actions check local storage before the editor or its tools mount. An
existing valid project requires a native confirmation, initially focused on **Keep my project**.
Confirm replaces it; Keep, Escape and dismissal re-read and resume the latest saved project without
a startup write, so changes from another tab during confirmation are not discarded.
No saved project means a direct start. A failed read or invalid save uses the existing recovery
state and warning without automatically overwriting it. See the [persistence contract](TECHNICAL_ARCHITECTURE.md#16-mvp-persistence).

The same guard handles hero, guide, footer and direct start URLs. Once the decision is resolved,
remove only the `start` parameter; retain unrelated parameters and fragments. Refresh restores
subsequent edits instead of repeating the replacement. Generic `/creator` always resumes. No
separate preview mode, extra persistence slot or new onboarding route is introduced.

## Responsive and implementation principles

- Hero text then preview on phones; two columns on desktop.
- Below 768px, process steps stack in 01–02–03 order with 88px thumbnails beside readable copy;
  at wider widths they form one row with larger images. Keep the photo caveat below the list.
- Shared editing precedes agent setup; use compact section spacing so the collaboration story
  does not disappear behind a long sequence of full-width room images on phones.
- Prompt and instructions remain readable and selectable without horizontal scrolling.
- Keep static content server-rendered; isolate copying as a small client interaction.
- Use existing primitives/tokens; no new layout library, WebGL scene or agent runtime on the landing.
- Production images need dimensions, responsive sizing, descriptive alt text and provenance.
- The approved full-page mockup is documentation, never the shipped page or hero image.
- The hero concept and the symbolic goals/budget step are intentionally illustrative rather than
  product-interface evidence.
