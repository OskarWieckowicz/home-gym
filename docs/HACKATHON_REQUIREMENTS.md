# WebMCP Challenge — sources and requirements

> Information status: 27 August 2026. This document is a working summary. If there is a discrepancy, the current official rules published by Devpost are the deciding source.

## Key links

### Challenge pages

- [WebMCP Challenge on Devpost](https://webmcp.devpost.com/) — registration, deadlines, requirements, and the submission form.
- [Official rules](https://webmcp.devpost.com/rules) — the full, legally binding rules.
- [Devpost materials and resources](https://webmcp.devpost.com/resources) — documentation, examples, and partner materials.
- [Challenge page on OpenAI](https://openai.com/webmcp-challenge/) — idea, dates, prizes, and inspiration.
- [WebMCP Showcase](https://developers.openai.com/showcase?view=webmcp-apps) — example agent-native applications.

### WebMCP documentation

- [OpenAI Docs — Site tools / WebMCP](https://learn.chatgpt.com/docs/webmcp) — how WebMCP works in ChatGPT and Codex.
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/) — the proposed standard and API.
- [WebMCP repository](https://github.com/webmachinelearning/webmcp) — specification sources, explainers, and open issues.
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp) — API, setup, and testing.
- [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) — designing names, schemas, and the tool set.
- [WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools) — security, trust, and prompt injection.

## Challenge goal

Build a working web application that uses WebMCP and shows the future of an open internet where people and agents can perform tasks, collaborate, and create together.

The project should be **meaningfully better because of human–agent collaboration**. Adding a single WebMCP tool to an ordinary page may not be enough to score highly on technology use.

WebMCP lets a page expose structured tools that operate on the open page and its current state. The agent does not have to guess the next clicks in the UI — it can call defined operations with inputs described by JSON Schema.

## Key dates

- **Registration and submissions open:** 25 August 2026.
- **Submission deadline:** 3 September 2026, 1:00 PM PDT.
- **Deadline in Poland:** 3 September 2026, 10:00 PM CEST.
- **Judging period:** 4–21 September 2026.
- **Planned results announcement:** around 23 September 2026; the date may change.

After the submission period ends, the sent submission cannot be freely changed. Devpost may allow only limited corrections, including for rights violations, personal-data disclosure, or inappropriate materials.

## Who can participate

The challenge is intended for:

- adult participants who meet the requirements of their country of residence,
- teams composed of eligible participants,
- eligible organizations.

A participant or organization must come from a country or territory served by the OpenAI API and must not be subject to exclusions described in the rules. A team or organization must designate one representative authorized to make the submission.

Before sending the project, re-check the Eligibility section in the [official rules](https://webmcp.devpost.com/rules).

## Project requirements

The project must:

- be a web application that uses WebMCP,
- run stably and match the behavior shown in the description and video,
- be available on the platform named in the submission,
- have a non-trivial, working WebMCP implementation,
- allow judges to access and test it without fees or restrictions during the judging period,
- be original work of the participant or team,
- not infringe copyrights, trademarks, privacy, or other third-party rights.

The application may be hosted on ChatGPT Sites, Cloudflare, Vercel, Render, Netlify, Shopify, or any other platform.

Authorization is allowed. If the application requires login, the submission must include working test credentials and clear access instructions.

## New or existing project

Two cases are allowed:

1. a new project created during the challenge period,
2. an existing project substantially extended with WebMCP after the submission period began.

For a prior project, only work added during the challenge is judged. Clearly distinguish the earlier scope from the new changes and keep evidence, for example a dated commit history.

For Home Gym Creator, that means it is worth:

- keeping a readable Git history from the start of the work,
- making regular, descriptive commits,
- noting in the README that the project was created for the WebMCP Challenge,
- describing which parts implement WebMCP.

## Integrations and external materials

If the project uses external APIs, SDKs, data, 3D models, photos, fonts, music, or other materials, the participant must have the right to use them and must follow the relevant licenses.

For Home Gym Creator, the safest hackathon variant is:

- fictional brands and products,
- own catalog data,
- own or properly licensed models and graphics,
- no third-party music in the video,
- recording the licenses of used dependencies and assets.

## Required submission elements

### 1. Working public application URL

Provide a working live URL available to judges in:

- the in-app browser in ChatGPT, or
- Google Chrome with WebMCP enabled.

The address must remain freely available until the judging period ends. Do not assume that judges will fix configuration themselves, create an account, or guess how to run the project.

### 2. Project text description

The description must explain:

- why the use case fits WebMCP well,
- how WebMCP improves the user experience,
- what a human and an agent can do together that was previously hard or impossible,
- how WebMCP was implemented.

The description should also clearly present:

- the real problem and target user,
- the main demo scenario,
- the application's most important features,
- the agent's scope of action,
- the role of the application's deterministic logic,
- prototype limitations.

### 3. Public repository

Provide a public repository URL on GitHub, GitLab, or Bitbucket. The repository must contain:

- all required source code,
- required assets,
- install and run instructions,
- WebMCP testing instructions,
- an open-source license file,
- an actual WebMCP tool implementation, for example via `document.modelContext.registerTool(...)`.

The license should be detected and visible at the top of the repository page, in the About section. Before sending, check the repository view as a logged-out user.

Recommended README contents:

- a short product description,
- live demo URL,
- screenshots or a GIF,
- environment requirements,
- installation and run steps,
- how to run tests,
- how to enable WebMCP,
- a list of exposed tools,
- sample demo prompts,
- application architecture,
- license and asset information.

### 4. Demo video

The video must:

- last **less than 3 minutes**,
- show the working project,
- include audio or narration explaining the product and WebMCP use,
- be publicly available on YouTube,
- be linked in the submission form,
- not contain third-party trademarks, music, or protected materials without appropriate permission.

Judges do not have to watch material beyond three minutes. They may also score the submission without testing the application themselves, based only on the video, text, and graphics. The video should therefore show the entire most important flow, not only announce available features.

### 5. Submission language

All submission materials must be in English. If any material is in another language, an English translation must be provided, including for:

- the video,
- the description,
- testing instructions,
- remaining submission materials.

The simplest approach is to prepare an English application UI, README, video narration, and Devpost description from the start.

## Testing WebMCP

According to the current challenge documentation, the project can be tested in two ways:

### ChatGPT / Codex

- use the current ChatGPT desktop application,
- open the page in the in-app browser,
- let the agent discover the page's tools,
- test calls on that same open page and session.

According to current OpenAI Docs, site tools work with GPT-5.6 Sol and GPT-5.6 Terra; GPT-5.6 Luna currently has WebMCP disabled. Availability may change, so re-check it before recording the video and submitting.

### Google Chrome

- use Chrome 149 or newer,
- go to `chrome://flags/#enable-webmcp-testing`,
- set the flag to enabled,
- restart the browser,
- verify registration, input schemas, responses, and tool errors.

The project should be tested in a fresh session, because a judge's environment will not have the author's local state.

## Judging criteria

First, the submission goes through a pass/fail stage checking basic fit with the theme and required technology use.

Projects that continue are scored in four equal categories:

### 1. WebMCP Leverage

- How accurately and skillfully does the project use WebMCP?
- Is the implementation working and non-trivial?
- Does the agent actually use the application's state and functions?

### 2. Execution

- Does the project work or can it be run?
- Does it create a coherent, complete product experience?
- Is it more than a technical proof of concept?

### 3. Potential Impact

- Does the project solve a concrete problem for a concrete user group?
- Does the demonstration show that the solution actually addresses that problem?

### 4. Creativity & Ambition

- Is the concept creative and ambitious?
- Does it differ from existing solutions and other projects?

In a tie, the first criterion, **WebMCP Leverage**, takes precedence, then the remaining criteria in the given order.

## How the requirements map onto Home Gym Creator

The project should especially show:

- the agent reading the current room model,
- creating and editing obstacles through WebMCP,
- searching products by budget, size, and goals,
- visible equipment placement by the agent,
- deterministic collision and clearance-zone validation,
- iterative design improvement after validation results,
- a manual change made by the user,
- the agent reacting to the new state of the same scene,
- a final shopping list and cost summary.

The most important scene for WebMCP scoring should look like this:

1. the user manually changes the design,
2. the agent reads the updated state,
3. the agent performs several related operations through WebMCP,
4. the application validates the result,
5. the user sees and judges the changes in the same interface.

## Pre-submission checklist

### Organization

- [ ] Devpost registration is complete.
- [ ] The participant or all team members meet Eligibility requirements.
- [ ] For a team, a representative has been designated.
- [ ] The submission is saved as a draft early enough.

### Application

- [ ] The live URL works without the author's development environment.
- [ ] The application starts in the ChatGPT browser.
- [ ] The application works in Chrome with WebMCP.
- [ ] Tools are discovered after a fresh page reload.
- [ ] Input schemas are valid.
- [ ] Read-only and state-modifying tools behave as described.
- [ ] Tool results include data that lets the agent verify the operation.
- [ ] Errors are readable for the user and the agent.
- [ ] The main demo scenario works repeatably.
- [ ] No private data or author local state is required.

### Repository

- [ ] The repository is public.
- [ ] Code and all required assets are present.
- [ ] The README contains complete instructions.
- [ ] An open-source license file has been added.
- [ ] The license is detected and visible in About.
- [ ] Commit history documents work done during the challenge.
- [ ] The repository contains no secrets, API keys, or private data.
- [ ] Licenses of dependencies, models, and graphics match the use.

### Video and description

- [ ] The video lasts less than 3 minutes.
- [ ] The video shows the working application, not only slides.
- [ ] The video shows real WebMCP calls and visible results.
- [ ] The video has English narration or a full English translation.
- [ ] The video is public on YouTube.
- [ ] It contains no unauthorized marks, music, or materials.
- [ ] The description answers all four required questions about WebMCP.
- [ ] The description, testing instructions, and remaining materials are in English.

### Finalization

- [ ] All links were checked in private mode or after logging out.
- [ ] If login is required, a working test account was provided.
- [ ] The submission was sent before 3 September 2026, 10:00 PM CEST.
- [ ] After sending, a copy of the text, links, and video version was saved.
