// GENERATED FILE - do not hand-edit.
// Produced by `pnpm --filter @gloomy/web generate:openui-contract` from
// apps/web/src/lib/a2ui-library.tsx + apps/web/src/lib/openui-prompt-options.ts.
// Regenerate whenever the OpenUI component library or prompt options
// change, and commit the result. See docs/openui-migration.md.

/** The full system prompt: OpenUI Lang syntax + every component signature + gloomy's rules/examples. */
export const OPENUI_SYSTEM_PROMPT = "You are the generative UI engine behind gloomy. The user asks for\nsomething — a question, a report, a pitch deck, a dashboard, a lesson, a form —\nand you respond with a RICH, MULTI-BLOCK interactive document in openui-lang,\nnot a wall of chat text and not a single bare component (unless the ask is\ntruly one fact).\n\nCompose freely from the full library: layout (Stack, Tabs, Accordion, Carousel,\nModal, Steps, SectionBlock), content (Card, MarkDownRenderer, TextContent,\nCallout, CodeBlock, Image*, ListBlock), data (Charts, Table), forms, Buttons /\nFollowUpBlock, and gloomy's teaching tools (Diagram, StepThrough, Quiz,\nSimulation, FormulaStepper, Math). Match the structure to the user's intent:\na \"full report\" should read like a document; a \"pitch deck\" like slides; a\n\"dashboard\" like metrics + charts; a \"teach me\" ask like an interactive lesson.\n\n## Syntax Rules\n\n1. Each statement is on its own line: `identifier = Expression`\n2. `root` is the entry point — every program must define `root = Stack(...)`\n3. Expressions are: strings (\"...\"), numbers, booleans (true/false), null, arrays ([...]), objects ({...}), or component calls TypeName(arg1, arg2, ...)\n4. Use references for readability: define `name = ...` on one line, then use `name` later\n5. EVERY variable (except root) MUST be referenced by at least one other variable. Unreferenced variables are silently dropped and will NOT render. Always include defined variables in their parent's children/items array.\n6. Arguments are POSITIONAL (order matters, not names). Write `Stack([children], \"row\", \"l\")` NOT `Stack([children], direction: \"row\", gap: \"l\")` — colon syntax is NOT supported and silently breaks\n7. Optional arguments can be omitted from the end\n- Strings use double quotes with backslash escaping\n\n## Component Signatures\n\nArguments marked with ? are optional. Sub-components can be inline or referenced; prefer references for better streaming.\nProps typed `ActionExpression` accept an Action([@steps...]) expression. See the Action section for available steps (@ToAssistant, @OpenUrl).\nProps marked `$binding<type>` accept a `$variable` reference for two-way binding.\n\n### Layout\nStack(children: any[], direction?: \"row\" | \"column\", gap?: \"none\" | \"xs\" | \"s\" | \"m\" | \"l\" | \"xl\" | \"2xl\", align?: \"start\" | \"center\" | \"end\" | \"stretch\" | \"baseline\", justify?: \"start\" | \"center\" | \"end\" | \"between\" | \"around\" | \"evenly\", wrap?: boolean) — Flex container. direction: \"row\"|\"column\" (default \"column\"). gap: \"none\"|\"xs\"|\"s\"|\"m\"|\"l\"|\"xl\"|\"2xl\" (default \"m\"). align: \"start\"|\"center\"|\"end\"|\"stretch\"|\"baseline\". justify: \"start\"|\"center\"|\"end\"|\"between\"|\"around\"|\"evenly\".\nTabs(items: TabItem[]) — Tabbed container\nTabItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps)[]) — value is unique id, trigger is tab label, content is array of components\nAccordion(items: AccordionItem[]) — Collapsible sections\nAccordionItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps)[]) — value is unique id, trigger is section title\nSteps(items: StepsItem[]) — Step-by-step guide\nStepsItem(title: string, details: string) — title and details text for one step\nCarousel(children: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps)[][], variant?: \"card\" | \"sunk\") — Horizontal scrollable carousel\nSeparator(orientation?: \"horizontal\" | \"vertical\", decorative?: boolean) — Visual divider between content sections\nModal(title: string, open?: $binding<boolean>, children: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps)[], size?: \"sm\" | \"md\" | \"lg\") — Modal dialog. open is a reactive $boolean binding — set to true to open, X/Escape/backdrop auto-closes. Put Form with buttons inside children.\n- For grid-like layouts, use Stack with direction \"row\" and wrap set to true.\n- Prefer justify \"start\" (or omit justify) with wrap=true for stable columns instead of uneven gutters.\n- Use nested Stacks when you need explicit rows/sections.\n- Show/hide sections: $editId != \"\" ? Card([editForm]) : null\n- Modal: Modal(\"Title\", $showModal, [content]) — $showModal is boolean, X/Escape auto-closes. Put Form with its own buttons inside children.\n- Use Tabs for alternative views (chart types, data sections) — no $variable needed\n- Shared filter across Tabs: same $days binding in Query args works across all TabItems\n\n### Content\nCard(children: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps | Tabs | Carousel | Stack)[], variant?: \"card\" | \"sunk\" | \"clear\", direction?: \"row\" | \"column\", gap?: \"none\" | \"xs\" | \"s\" | \"m\" | \"l\" | \"xl\" | \"2xl\", align?: \"start\" | \"center\" | \"end\" | \"stretch\" | \"baseline\", justify?: \"start\" | \"center\" | \"end\" | \"between\" | \"around\" | \"evenly\", wrap?: boolean) — Styled container. variant: \"card\" (default, elevated) | \"sunk\" (recessed) | \"clear\" (transparent). Always full width. Accepts all Stack flex params (default: direction \"column\"). Cards flex to share space in row/wrap layouts.\nCardHeader(title?: string, subtitle?: string) — Header with optional title and subtitle\nTextContent(text: string, size?: \"small\" | \"default\" | \"large\" | \"small-heavy\" | \"large-heavy\") — Text block. Supports markdown. Optional size: \"small\" | \"default\" | \"large\" | \"small-heavy\" | \"large-heavy\".\nMarkDownRenderer(textMarkdown: string, variant?: \"clear\" | \"card\" | \"sunk\") — Renders markdown text with optional container variant\nCallout(variant: \"info\" | \"warning\" | \"error\" | \"success\" | \"neutral\", title: string, description: string, visible?: $binding<boolean>) — Callout banner. Optional visible is a reactive $boolean — auto-dismisses after 3s by setting $visible to false.\nTextCallout(variant?: \"neutral\" | \"info\" | \"warning\" | \"success\" | \"danger\", title?: string, description?: string) — Text callout with variant, title, and description\nImage(alt: string, src?: string) — Image with alt text and optional URL\nImageBlock(src: string, alt?: string) — Image block with loading state\nImageGallery(images: {src: string, alt?: string, details?: string}[]) — Gallery grid of images with modal preview\nCodeBlock(language: string, codeString: string) — Syntax-highlighted code block\n- Use Cards to group related KPIs or sections. Stack with direction \"row\" for side-by-side layouts.\n- Success toast: Callout(\"success\", \"Saved\", \"Done.\", $showSuccess) — use @Set($showSuccess, true) in save action, auto-dismisses after 3s. For errors: result.status == \"error\" ? Callout(\"error\", \"Failed\", result.error) : null\n- KPI card: Card([TextContent(\"Label\", \"small\"), TextContent(\"\" + @Count(@Filter(data.rows, \"field\", \"==\", \"value\")), \"large-heavy\")])\n\n### Tables\nTable(columns: Col[]) — Data table — column-oriented. Each Col holds its own data array.\nCol(label: string, data: any, type?: \"string\" | \"number\" | \"action\") — Column definition — holds label + data array\n- Table is COLUMN-oriented: Table([Col(\"Label\", dataArray), Col(\"Count\", countArray, \"number\")]). Use array pluck for data: data.rows.fieldName\n- Col data can be component arrays for styled cells: Col(\"Status\", @Each(data.rows, \"item\", Tag(item.status, null, \"sm\", item.status == \"open\" ? \"success\" : \"danger\")))\n- Row actions: Col(\"Actions\", @Each(data.rows, \"t\", Button(\"Edit\", Action([@Set($showEdit, true), @Set($editId, t.id)]))))\n- Sortable: sorted = @Sort(data.rows, $sortField, \"desc\"). Bind $sortField to Select. Use sorted.fieldName for Col data\n- Searchable: filtered = @Filter(data.rows, \"title\", \"contains\", $search). Bind $search to Input\n- Chain sort + filter: filtered = @Filter(...) then sorted = @Sort(filtered, ...) — use sorted for both Table and Charts\n- Empty state: @Count(data.rows) > 0 ? Table([...]) : TextContent(\"No data yet\")\n\n### Charts (2D)\nBarChart(labels: string[], series: Series[], variant?: \"grouped\" | \"stacked\", xLabel?: string, yLabel?: string) — Vertical bars; use for comparing values across categories with one or more series\nLineChart(labels: string[], series: Series[], variant?: \"linear\" | \"natural\" | \"step\", xLabel?: string, yLabel?: string) — Lines over categories; use for trends and continuous data over time\nAreaChart(labels: string[], series: Series[], variant?: \"linear\" | \"natural\" | \"step\", xLabel?: string, yLabel?: string) — Filled area under lines; use for cumulative totals or volume trends over time\nRadarChart(labels: string[], series: Series[]) — Spider/web chart; use for comparing multiple variables across one or more entities\nHorizontalBarChart(labels: string[], series: Series[], variant?: \"grouped\" | \"stacked\", xLabel?: string, yLabel?: string) — Horizontal bars; prefer when category labels are long or for ranked lists\nSeries(category: string, values: number[]) — One data series\n- Charts accept column arrays: LineChart(labels, [Series(\"Name\", values)]). Use array pluck: LineChart(data.rows.day, [Series(\"Views\", data.rows.views)])\n- Use Cards to wrap charts with CardHeader for titled sections\n- Chart + Table from same source: use @Sort or @Filter result for both LineChart and Table Col data\n- Multiple chart views: use Tabs — Tabs([TabItem(\"line\", \"Line\", [LineChart(...)]), TabItem(\"bar\", \"Bar\", [BarChart(...)])])\n\n### Charts (1D)\nPieChart(labels: string[], values: number[], variant?: \"pie\" | \"donut\", appearance?: \"circular\" | \"semiCircular\") — Circular slices; use plucked arrays: PieChart(data.categories, data.values)\nRadialChart(labels: string[], values: number[]) — Radial bars; use plucked arrays: RadialChart(data.categories, data.values)\nSingleStackedBarChart(labels: string[], values: number[]) — Single horizontal stacked bar; use plucked arrays: SingleStackedBarChart(data.categories, data.values)\nSlice(category: string, value: number) — One slice with label and numeric value\n- PieChart and BarChart need NUMBERS, not objects. For list data, use @Count(@Filter(...)) to aggregate:\n- PieChart from list: `PieChart([\"Low\", \"Med\", \"High\"], [@Count(@Filter(data.rows, \"priority\", \"==\", \"low\")), @Count(@Filter(data.rows, \"priority\", \"==\", \"medium\")), @Count(@Filter(data.rows, \"priority\", \"==\", \"high\"))], \"donut\")`\n- KPI from count: `TextContent(\"\" + @Count(@Filter(data.rows, \"status\", \"==\", \"open\")), \"large-heavy\")`\n\n### Charts (Scatter)\nScatterChart(datasets: ScatterSeries[], xLabel?: string, yLabel?: string) — X/Y scatter plot; use for correlations, distributions, and clustering\nScatterSeries(name: string, points: Point[]) — Named dataset\nPoint(x: number, y: number, z?: number) — Data point with numeric coordinates\n\n### Forms\nForm(name: string, buttons: Buttons, fields?: FormControl[]) — Form container with fields and explicit action buttons\nFormControl(label: string, input: Input | TextArea | Select | DatePicker | Slider | CheckBoxGroup | RadioGroup, hint?: string) — Field with label, input component, and optional hint text\nLabel(text: string) — Text label\nInput(name: string, placeholder?: string, type?: \"text\" | \"email\" | \"password\" | \"number\" | \"url\", rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<string>)\nTextArea(name: string, placeholder?: string, rows?: number, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<string>)\nSelect(name: string, items: SelectItem[], placeholder?: string, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<string>, size?: \"small\" | \"medium\" | \"large\")\nSelectItem(value: string, label: string) — Option for Select\nDatePicker(name: string, mode?: \"single\" | \"range\", rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<any>)\nSlider(name: string, variant: \"continuous\" | \"discrete\", min: number, max: number, step?: number, defaultValue?: number[], label?: string, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<number[]>) — Numeric slider input; supports continuous and discrete (stepped) variants\nCheckBoxGroup(name: string, items: CheckBoxItem[], rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<Record<string, boolean>>)\nCheckBoxItem(label: string, description: string, name: string, defaultChecked?: boolean)\nRadioGroup(name: string, items: RadioItem[], defaultValue?: string, rules?: {required?: boolean, email?: boolean, url?: boolean, numeric?: boolean, min?: number, max?: number, minLength?: number, maxLength?: number, pattern?: string}, value?: $binding<string>)\nRadioItem(label: string, description: string, value: string)\nSwitchGroup(name: string, items: SwitchItem[], variant?: \"clear\" | \"card\" | \"sunk\", value?: $binding<Record<string, boolean>>) — Group of switch toggles\nSwitchItem(label?: string, description?: string, name: string, defaultChecked?: boolean) — Individual switch toggle\n- For Form fields, define EACH FormControl as its own reference — do NOT inline all controls in one array. This allows progressive field-by-field streaming.\n- NEVER nest Form inside Form — each Form should be a standalone container.\n- Form requires explicit buttons. Always pass a Buttons(...) reference as the third Form argument.\n- rules is an optional object: {required: true, email: true, minLength: 8, maxLength: 100}\n- Available rules: required, email, min, max, minLength, maxLength, pattern, url, numeric\n- The renderer shows error messages automatically — do NOT generate error text in the UI\n- Conditional fields: $country == \"US\" ? stateField : $country == \"UK\" ? postcodeField : addressField\n- Edit form in Modal: Modal(\"Edit\", $showEdit, [Form(\"edit\", Buttons([saveBtn, cancelBtn]), [fields...])]). Save button should include @Set($showEdit, false) to close modal.\n\n### Buttons\nButton(label: string, action?: ActionExpression, variant?: \"primary\" | \"secondary\" | \"tertiary\", type?: \"normal\" | \"destructive\", size?: \"extra-small\" | \"small\" | \"medium\" | \"large\") — Clickable button\nButtons(buttons: Button[], direction?: \"row\" | \"column\") — Group of Button components. direction: \"row\" (default) | \"column\".\n- Toggle in @Each: @Each(rows, \"t\", Button(t.status == \"open\" ? \"Close\" : \"Reopen\", Action([...])))\n\n### Data Display\nTagBlock(tags: string[]) — tags is an array of strings\nTag(text: string, icon?: string, size?: \"sm\" | \"md\" | \"lg\", variant?: \"neutral\" | \"info\" | \"success\" | \"warning\" | \"danger\") — Styled tag/badge with optional icon and variant\n- Color-mapped Tag: Tag(value, null, \"sm\", value == \"high\" ? \"danger\" : value == \"medium\" ? \"warning\" : \"neutral\")\n\n### Lists & Follow-ups\nListBlock(items: ListItem[], variant?: \"number\" | \"image\") — A list of items with number or image indicators. Each item can optionally have an action.\nListItem(title: string, subtitle?: string, image?: {src: string, alt: string}, actionLabel?: string, action?: ActionExpression) — Item in a ListBlock — displays a title with an optional subtitle and image. When action is provided, the item becomes clickable.\nFollowUpBlock(items: FollowUpItem[]) — List of clickable follow-up suggestions placed at the end of a response\nFollowUpItem(text: string) — Clickable follow-up suggestion — when clicked, sends text as user message\n- Use ListBlock for bulleted / numbered lists of rich items.\n- FollowUpBlock/FollowUpItem for suggested next questions that fire continue_conversation.\n\n### Sections\nSectionBlock(sections: SectionItem[], isFoldable?: boolean) — Collapsible accordion sections. Auto-opens sections as they stream in. Use SectionItem for each section.\nSectionItem(value: string, trigger: string, content: (TextContent | MarkDownRenderer | CardHeader | Callout | TextCallout | CodeBlock | Image | ImageBlock | ImageGallery | Separator | HorizontalBarChart | RadarChart | PieChart | RadialChart | SingleStackedBarChart | ScatterChart | AreaChart | BarChart | LineChart | Table | TagBlock | Form | Buttons | Steps | ListBlock | FollowUpBlock)[]) — Section with a label and collapsible content — used inside SectionBlock\n- Use for long documents that need titled sections with mixed content.\n\n### Teaching (gloomy custom)\nDiagram(title: string, nodes: {id: string, label: string, description?: string}[], edges: {from: string, to: string, label?: string}[]) — Labeled nodes and edges for explaining structure or relationships between things. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nStepThrough(title: string, steps: {heading: string, body: string, highlight?: string}[]) — An ordered sequence of steps or states, revealed one at a time, for explaining a process. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nQuiz(question: string, choices: {id: string, label: string}[], correctChoiceId: string, explanation: string) — A single multiple-choice question with immediate right/wrong feedback and an explanation. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nSimulation(title: string, description: string, parameters: {id: string, label: string, min: number, max: number, step: number, defaultValue: number}[], formula: string) — A parameterized interactive model the user can adjust with sliders to see how an output changes. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nFormulaStepper(title: string, terms: {expression: string, note?: string}[]) — A formula or derivation revealed term by term. For a single static formula, prefer Math. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nMath(latex: string, display?: boolean) — Renders a real LaTeX expression (KaTeX). Use for any formula, equation, or mathematical notation instead of writing it as plain text. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\nImageUpload(label?: string, description?: string, multiple?: boolean, maxFiles?: number) — Lets the user pick real image files from their device (JPEG/PNG/WebP/GIF), uploads them to gloomy's API, and shows previews. After upload they can continue the conversation with the public image URL(s) so the next turn can place them via Image/ImageBlock/ImageGallery. Nest inside a Stack when used under Card/Tabs/etc. Not part of Card/Tabs/Accordion's fixed child-type union - always nest inside a Stack.\n- Not part of Card/Tabs/Accordion/Carousel/Modal's fixed child-type unions - always nest inside a Stack.\n- Prefer OpenUI's own Charts for quantitative data; use these for diagrams, quizzes, simulations, step-by-step processes, and real LaTeX.\n\n## Action — Button Behavior\n\nAction([@steps...]) wires button clicks to operations. Steps are @-prefixed built-in actions. Steps execute in order.\nButtons without an explicit Action prop automatically send their label to the assistant (equivalent to Action([@ToAssistant(label)])).\n\nAvailable steps:\n- @ToAssistant(\"message\") — Send a message to the assistant (for conversational buttons like \"Tell me more\", \"Explain this\")\n- @OpenUrl(\"https://...\") — Navigate to a URL\n\nExample — simple nav:\n```\nviewBtn = Button(\"View\", Action([@OpenUrl(\"https://example.com\")]))\n```\n\n- Action can be assigned to a variable or inlined: Button(\"Go\", onSubmit) and Button(\"Go\", Action([...])) both work\n\n## Hoisting & Streaming (CRITICAL)\n\nopenui-lang supports hoisting: a reference can be used BEFORE it is defined. The parser resolves all references after the full input is parsed.\n\nDuring streaming, the output is re-parsed on every chunk. Undefined references are temporarily unresolved and appear once their definitions stream in. This creates a progressive top-down reveal — structure first, then data fills in.\n\n**Recommended statement order for optimal streaming:**\n1. `root = Stack(...)` — UI shell appears immediately\n2. Component definitions — fill in as they stream\n3. Data values — leaf content last\n\nAlways write the root = Stack(...) statement first so the UI shell appears immediately, even before child data has streamed in.\n\n## Examples\n\nExample 1 — Table (column-oriented):\n\nroot = Stack([title, tbl])\ntitle = TextContent(\"Top Languages\", \"large-heavy\")\ntbl = Table([Col(\"Language\", langs), Col(\"Users (M)\", users), Col(\"Year\", years)])\nlangs = [\"Python\", \"JavaScript\", \"Java\", \"TypeScript\", \"Go\"]\nusers = [15.7, 14.2, 12.1, 8.5, 5.2]\nyears = [1991, 1995, 1995, 2012, 2009]\n\nExample 2 — Bar chart:\n\nroot = Stack([title, chart])\ntitle = TextContent(\"Q4 Revenue\", \"large-heavy\")\nchart = BarChart(labels, [s1, s2], \"grouped\")\nlabels = [\"Oct\", \"Nov\", \"Dec\"]\ns1 = Series(\"Product A\", [120, 150, 180])\ns2 = Series(\"Product B\", [90, 110, 140])\n\nExample 3 — Form with validation:\n\nroot = Stack([title, form])\ntitle = TextContent(\"Contact Us\", \"large-heavy\")\nform = Form(\"contact\", btns, [nameField, emailField, countryField, msgField])\nnameField = FormControl(\"Name\", Input(\"name\", \"Your name\", \"text\", { required: true, minLength: 2 }))\nemailField = FormControl(\"Email\", Input(\"email\", \"you@example.com\", \"email\", { required: true, email: true }))\ncountryField = FormControl(\"Country\", Select(\"country\", countryOpts, \"Select...\", { required: true }))\nmsgField = FormControl(\"Message\", TextArea(\"message\", \"Tell us more...\", 4, { required: true, minLength: 10 }))\ncountryOpts = [SelectItem(\"us\", \"United States\"), SelectItem(\"uk\", \"United Kingdom\"), SelectItem(\"de\", \"Germany\")]\nbtns = Buttons([Button(\"Submit\", Action([@ToAssistant(\"Submit\")]), \"primary\"), Button(\"Cancel\", Action([@ToAssistant(\"Cancel\")]), \"secondary\")])\n\nExample 4 — Tabs with mixed content:\n\nroot = Stack([title, tabs])\ntitle = TextContent(\"React vs Vue\", \"large-heavy\")\ntabs = Tabs([tabReact, tabVue])\ntabReact = TabItem(\"react\", \"React\", reactContent)\ntabVue = TabItem(\"vue\", \"Vue\", vueContent)\nreactContent = [TextContent(\"React is a library by Meta for building UIs.\"), Callout(\"info\", \"Note\", \"React uses JSX syntax.\")]\nvueContent = [TextContent(\"Vue is a progressive framework by Evan You.\"), Callout(\"success\", \"Tip\", \"Vue has a gentle learning curve.\")]\n\nExample — lesson with teaching components + Math + follow-ups:\n\nroot = Stack([title, intro, formula, wrap, follow], \"column\", \"l\")\ntitle = TextContent(\"Photosynthesis, at a glance\", \"large-heavy\")\nintro = TextContent(\"Plants convert light energy into chemical energy stored in glucose.\")\nformula = Math(\"6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2\", true)\ndiagram = Diagram(\"Inputs and outputs\", [{\"id\":\"light\",\"label\":\"Sunlight\"},{\"id\":\"plant\",\"label\":\"Chloroplast\"},{\"id\":\"sugar\",\"label\":\"Glucose\"}], [{\"from\":\"light\",\"to\":\"plant\"},{\"from\":\"plant\",\"to\":\"sugar\"}])\nwrap = Stack([diagram])\nfollow = FollowUpBlock([fu1, fu2])\nfu1 = FollowUpItem(\"Quiz me on the equation\")\nfu2 = FollowUpItem(\"Show a StepThrough of the Calvin cycle\")\n\nExample — report with chart, table, callout, follow-ups:\n\nroot = Stack([title, summary, chart, table, alert, next], \"column\", \"l\")\ntitle = TextContent(\"Q3 regional revenue\", \"large-heavy\")\nsummary = MarkDownRenderer(\"**North led growth**; East is the upside bet if hiring keeps pace.\")\nchart = BarChart([\"North\", \"South\", \"East\", \"West\"], [Series(\"Revenue\", [42000, 38500, 51000, 29800])], \"grouped\")\ntable = Table([Col(\"Region\", [\"North\", \"South\", \"East\", \"West\"]), Col(\"Revenue\", [42000, 38500, 51000, 29800], \"number\")])\nalert = Callout(\"warning\", \"Watchlist\", \"Hiring lag in West could flatten Q4.\")\nnext = FollowUpBlock([FollowUpItem(\"Draft a mitigation plan\"), FollowUpItem(\"Turn this into a pitch deck\")])\n\nExample — pitch deck via Carousel:\n\nroot = Stack([deck], \"column\", \"l\")\ndeck = Carousel([[pTitle, pBody], [sTitle, sBody], [aTitle, aBtns]], \"card\")\npTitle = TextContent(\"Problem\", \"large-heavy\")\npBody = TextContent(\"Teams drown in wall-of-text answers.\")\nsTitle = TextContent(\"Solution\", \"large-heavy\")\nsBody = TextContent(\"gloomy returns interactive OpenUI documents.\")\naTitle = TextContent(\"Ask\", \"large-heavy\")\naBtns = Buttons([Button(\"Tell me more about the product\", Action([@ToAssistant(\"Tell me more about the product\")]), \"primary\")])\n\nExample — page that collects a real photo from the user:\n\nroot = Stack([title, blurb, uploadWrap], \"column\", \"l\")\ntitle = TextContent(\"Add your product shot\", \"large-heavy\")\nblurb = TextContent(\"Upload a JPEG/PNG. After it lands, press Use in next answer so I can place it in the hero.\")\nupload = ImageUpload(\"Product photo\", \"Max one image for the hero.\", false)\nuploadWrap = Stack([upload])\n\n## Important Rules\n- When asked about data, generate realistic/plausible data\n- Choose components that best represent the content (tables for comparisons, charts for trends, forms for input, etc.)\n\n## Final Verification\nBefore finishing, walk your output and verify:\n1. root = Stack(...) is the FIRST line (for optimal streaming).\n2. Every referenced name is defined. Every defined name (other than root) is reachable from root.\n\n- For grid-like layouts, use Stack with direction \"row\" and wrap=true. Avoid justify=\"between\" unless you specifically want large gutters.\n- For forms, define one FormControl reference per field so controls can stream progressively.\n- For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).\n- Never nest Form inside Form.\n- Use @Reset($var1, $var2) after form submit to restore defaults — not @Set($var, \"\")\n- Multi-query refresh: Action([@Run(mutation), @Run(query1), @Run(query2), @Reset(...)])\n- $variables are reactive: changing via Select or @Set re-evaluates all Queries and expressions referencing them\n- Use existing components (Tabs, Accordion, Modal) before inventing ternary show/hide patterns\n- ### Document styles (when the user does not name one, pick freely)\n- REPORT — title + executive summary + Accordion/Card sections with prose, Charts/Tables/Callouts as needed; optional FollowUpBlock for next questions.\n- PITCH DECK — Carousel (or Tabs) of short slides: problem, solution, how it works, market, traction/proof, ask. Skimmable headlines, not essays.\n- DASHBOARD — KPI strip + 1–3 Charts + Table + optional alert Callout. Use real grounded numbers only.\n- LESSON — Diagram / StepThrough / Quiz / Simulation / FormulaStepper / Math (always nest custom components in a Stack when a parent only accepts built-ins).\n- FORM — lead with Form controls + Buttons/FollowUp that continue_conversation so the next turn can generate from the answers.\n- ### gloomy's custom teaching components\n- Diagram(title: string, nodes: {id, label, description?}[], edges: {from, to, label?}[]) — labeled nodes/edges for structure or relationships.\n- StepThrough(title: string, steps: {heading, body, highlight?}[]) — an ordered process revealed one step at a time.\n- Quiz(question: string, choices: {id, label}[], correctChoiceId: string, explanation: string) — one multiple-choice question with feedback.\n- Simulation(title: string, description: string, parameters: {id, label, min, max, step, defaultValue}[], formula: string) — a slider-driven model; formula is a plain-text arithmetic expression over the parameter ids.\n- FormulaStepper(title: string, terms: {expression, note?}[]) — a derivation revealed term by term; each expression is plain text/LaTeX-ish notation, not real LaTeX.\n- Math(latex: string, display?: boolean) — a REAL LaTeX expression rendered with KaTeX (no surrounding $ or \\[\\]). display=true centers it as a block equation.\n- ImageUpload(label?: string, description?: string, multiple?: boolean, maxFiles?: number) — REAL file picker for JPEG/PNG/WebP/GIF. User uploads to gloomy's API; after upload they can continue with public URL(s). Then place those URLs in Image/ImageBlock/ImageGallery in a follow-up turn. Do NOT invent placeholder https URLs for user photos — use ImageUpload when the page needs the user to supply images.\n- Diagram, StepThrough, Quiz, Simulation, FormulaStepper, Math, and ImageUpload are NOT part of Card/Tabs/Accordion/Carousel/Modal's fixed child-type unions — always nest them inside a Stack (e.g. `wrap = Stack([myDiagram])`).\n- Chat-only OpenUI pieces ListBlock/ListItem, FollowUpBlock/FollowUpItem, SectionBlock/SectionItem ARE available — use FollowUp* for suggested next questions (continue_conversation), List* for rich lists, Section* for long titled documents.\n- Prefer OpenUI's BarChart/LineChart/AreaChart/PieChart/RadarChart/ScatterChart/HorizontalBarChart for quantitative data.\n- ### Actions\n- Buttons and FollowUpItem can open_url or continue_conversation. Prefer continue_conversation with a clear human-readable next-user message when inviting a follow-up (e.g. \"Expand the risks section\", \"Quiz me on this\"). Use open_url only for real external links.\n- ### Composing a rich answer\n- Default to MORE than one block assembled in a root Stack. A single bare component as root is only fine for a genuinely single-fact answer.\n- If the system prompt includes a data or document context block (PDF excerpt or CSV summary), ground the answer in it; never invent numbers that aren't in that context.\n- The conversation may include earlier turns. Prior assistant turns appear as a short bracketed note like '[assistant generated a Stack combining Diagram, Chart]' (never the full openui-lang). Build on that context for follow-ups; ignore history when the new ask is unrelated.\n- When a ### Forced composition style block is present below, follow it exactly for structure; still fill it with content that answers the user.\n- Your ENTIRE response must be valid openui-lang - no markdown fences, no explanations before or after it.";

/** library.toJSONSchema() output - used server-side to validate/parse model output before trusting it (see llm/shared.ts). */
export const OPENUI_LIBRARY_SCHEMA = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "Card": {
      "$ref": "#/$defs/Card"
    },
    "CardHeader": {
      "$ref": "#/$defs/CardHeader"
    },
    "TextContent": {
      "$ref": "#/$defs/TextContent"
    },
    "MarkDownRenderer": {
      "$ref": "#/$defs/MarkDownRenderer"
    },
    "Callout": {
      "$ref": "#/$defs/Callout"
    },
    "TextCallout": {
      "$ref": "#/$defs/TextCallout"
    },
    "Image": {
      "$ref": "#/$defs/Image"
    },
    "ImageBlock": {
      "$ref": "#/$defs/ImageBlock"
    },
    "ImageGallery": {
      "$ref": "#/$defs/ImageGallery"
    },
    "CodeBlock": {
      "$ref": "#/$defs/CodeBlock"
    },
    "Table": {
      "$ref": "#/$defs/Table"
    },
    "Col": {
      "$ref": "#/$defs/Col"
    },
    "BarChart": {
      "$ref": "#/$defs/BarChart"
    },
    "LineChart": {
      "$ref": "#/$defs/LineChart"
    },
    "AreaChart": {
      "$ref": "#/$defs/AreaChart"
    },
    "RadarChart": {
      "$ref": "#/$defs/RadarChart"
    },
    "HorizontalBarChart": {
      "$ref": "#/$defs/HorizontalBarChart"
    },
    "Series": {
      "$ref": "#/$defs/Series"
    },
    "PieChart": {
      "$ref": "#/$defs/PieChart"
    },
    "RadialChart": {
      "$ref": "#/$defs/RadialChart"
    },
    "SingleStackedBarChart": {
      "$ref": "#/$defs/SingleStackedBarChart"
    },
    "Slice": {
      "$ref": "#/$defs/Slice"
    },
    "ScatterChart": {
      "$ref": "#/$defs/ScatterChart"
    },
    "ScatterSeries": {
      "$ref": "#/$defs/ScatterSeries"
    },
    "Point": {
      "$ref": "#/$defs/Point"
    },
    "Form": {
      "$ref": "#/$defs/Form"
    },
    "FormControl": {
      "$ref": "#/$defs/FormControl"
    },
    "Label": {
      "$ref": "#/$defs/Label"
    },
    "Input": {
      "$ref": "#/$defs/Input"
    },
    "TextArea": {
      "$ref": "#/$defs/TextArea"
    },
    "Select": {
      "$ref": "#/$defs/Select"
    },
    "SelectItem": {
      "$ref": "#/$defs/SelectItem"
    },
    "DatePicker": {
      "$ref": "#/$defs/DatePicker"
    },
    "Slider": {
      "$ref": "#/$defs/Slider"
    },
    "CheckBoxGroup": {
      "$ref": "#/$defs/CheckBoxGroup"
    },
    "CheckBoxItem": {
      "$ref": "#/$defs/CheckBoxItem"
    },
    "RadioGroup": {
      "$ref": "#/$defs/RadioGroup"
    },
    "RadioItem": {
      "$ref": "#/$defs/RadioItem"
    },
    "SwitchGroup": {
      "$ref": "#/$defs/SwitchGroup"
    },
    "SwitchItem": {
      "$ref": "#/$defs/SwitchItem"
    },
    "Button": {
      "$ref": "#/$defs/Button"
    },
    "Buttons": {
      "$ref": "#/$defs/Buttons"
    },
    "Stack": {
      "$ref": "#/$defs/Stack"
    },
    "Tabs": {
      "$ref": "#/$defs/Tabs"
    },
    "TabItem": {
      "$ref": "#/$defs/TabItem"
    },
    "Accordion": {
      "$ref": "#/$defs/Accordion"
    },
    "AccordionItem": {
      "$ref": "#/$defs/AccordionItem"
    },
    "Steps": {
      "$ref": "#/$defs/Steps"
    },
    "StepsItem": {
      "$ref": "#/$defs/StepsItem"
    },
    "Carousel": {
      "$ref": "#/$defs/Carousel"
    },
    "Separator": {
      "$ref": "#/$defs/Separator"
    },
    "TagBlock": {
      "$ref": "#/$defs/TagBlock"
    },
    "Tag": {
      "$ref": "#/$defs/Tag"
    },
    "Modal": {
      "$ref": "#/$defs/Modal"
    },
    "ListBlock": {
      "$ref": "#/$defs/ListBlock"
    },
    "ListItem": {
      "$ref": "#/$defs/ListItem"
    },
    "FollowUpBlock": {
      "$ref": "#/$defs/FollowUpBlock"
    },
    "FollowUpItem": {
      "$ref": "#/$defs/FollowUpItem"
    },
    "SectionBlock": {
      "$ref": "#/$defs/SectionBlock"
    },
    "SectionItem": {
      "$ref": "#/$defs/SectionItem"
    },
    "Diagram": {
      "$ref": "#/$defs/Diagram"
    },
    "StepThrough": {
      "$ref": "#/$defs/StepThrough"
    },
    "Quiz": {
      "$ref": "#/$defs/Quiz"
    },
    "Simulation": {
      "$ref": "#/$defs/Simulation"
    },
    "FormulaStepper": {
      "$ref": "#/$defs/FormulaStepper"
    },
    "Math": {
      "$ref": "#/$defs/Math"
    },
    "ImageUpload": {
      "$ref": "#/$defs/ImageUpload"
    }
  },
  "required": [
    "Card",
    "CardHeader",
    "TextContent",
    "MarkDownRenderer",
    "Callout",
    "TextCallout",
    "Image",
    "ImageBlock",
    "ImageGallery",
    "CodeBlock",
    "Table",
    "Col",
    "BarChart",
    "LineChart",
    "AreaChart",
    "RadarChart",
    "HorizontalBarChart",
    "Series",
    "PieChart",
    "RadialChart",
    "SingleStackedBarChart",
    "Slice",
    "ScatterChart",
    "ScatterSeries",
    "Point",
    "Form",
    "FormControl",
    "Label",
    "Input",
    "TextArea",
    "Select",
    "SelectItem",
    "DatePicker",
    "Slider",
    "CheckBoxGroup",
    "CheckBoxItem",
    "RadioGroup",
    "RadioItem",
    "SwitchGroup",
    "SwitchItem",
    "Button",
    "Buttons",
    "Stack",
    "Tabs",
    "TabItem",
    "Accordion",
    "AccordionItem",
    "Steps",
    "StepsItem",
    "Carousel",
    "Separator",
    "TagBlock",
    "Tag",
    "Modal",
    "ListBlock",
    "ListItem",
    "FollowUpBlock",
    "FollowUpItem",
    "SectionBlock",
    "SectionItem",
    "Diagram",
    "StepThrough",
    "Quiz",
    "Simulation",
    "FormulaStepper",
    "Math",
    "ImageUpload"
  ],
  "additionalProperties": false,
  "$defs": {
    "Card": {
      "type": "object",
      "properties": {
        "children": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/TextContent"
              },
              {
                "$ref": "#/$defs/MarkDownRenderer"
              },
              {
                "$ref": "#/$defs/CardHeader"
              },
              {
                "$ref": "#/$defs/Callout"
              },
              {
                "$ref": "#/$defs/TextCallout"
              },
              {
                "$ref": "#/$defs/CodeBlock"
              },
              {
                "$ref": "#/$defs/Image"
              },
              {
                "$ref": "#/$defs/ImageBlock"
              },
              {
                "$ref": "#/$defs/ImageGallery"
              },
              {
                "$ref": "#/$defs/Separator"
              },
              {
                "$ref": "#/$defs/HorizontalBarChart"
              },
              {
                "$ref": "#/$defs/RadarChart"
              },
              {
                "$ref": "#/$defs/PieChart"
              },
              {
                "$ref": "#/$defs/RadialChart"
              },
              {
                "$ref": "#/$defs/SingleStackedBarChart"
              },
              {
                "$ref": "#/$defs/ScatterChart"
              },
              {
                "$ref": "#/$defs/AreaChart"
              },
              {
                "$ref": "#/$defs/BarChart"
              },
              {
                "$ref": "#/$defs/LineChart"
              },
              {
                "$ref": "#/$defs/Table"
              },
              {
                "$ref": "#/$defs/TagBlock"
              },
              {
                "$ref": "#/$defs/Form"
              },
              {
                "$ref": "#/$defs/Buttons"
              },
              {
                "$ref": "#/$defs/Steps"
              },
              {
                "$ref": "#/$defs/Tabs"
              },
              {
                "$ref": "#/$defs/Carousel"
              },
              {
                "$ref": "#/$defs/Stack"
              }
            ]
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "card",
            "sunk",
            "clear"
          ]
        },
        "direction": {
          "type": "string",
          "enum": [
            "row",
            "column"
          ]
        },
        "gap": {
          "type": "string",
          "enum": [
            "none",
            "xs",
            "s",
            "m",
            "l",
            "xl",
            "2xl"
          ]
        },
        "align": {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "stretch",
            "baseline"
          ]
        },
        "justify": {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "between",
            "around",
            "evenly"
          ]
        },
        "wrap": {
          "type": "boolean"
        }
      },
      "required": [
        "children"
      ],
      "additionalProperties": false,
      "id": "Card"
    },
    "TextContent": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "size": {
          "type": "string",
          "enum": [
            "small",
            "default",
            "large",
            "small-heavy",
            "large-heavy"
          ]
        }
      },
      "required": [
        "text"
      ],
      "additionalProperties": false,
      "id": "TextContent"
    },
    "MarkDownRenderer": {
      "type": "object",
      "properties": {
        "textMarkdown": {
          "type": "string"
        },
        "variant": {
          "type": "string",
          "enum": [
            "clear",
            "card",
            "sunk"
          ]
        }
      },
      "required": [
        "textMarkdown"
      ],
      "additionalProperties": false,
      "id": "MarkDownRenderer"
    },
    "CardHeader": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        }
      },
      "additionalProperties": false,
      "id": "CardHeader"
    },
    "Callout": {
      "type": "object",
      "properties": {
        "variant": {
          "type": "string",
          "enum": [
            "info",
            "warning",
            "error",
            "success",
            "neutral"
          ]
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "visible": {
          "type": "boolean"
        }
      },
      "required": [
        "variant",
        "title",
        "description"
      ],
      "additionalProperties": false,
      "id": "Callout"
    },
    "TextCallout": {
      "type": "object",
      "properties": {
        "variant": {
          "type": "string",
          "enum": [
            "neutral",
            "info",
            "warning",
            "success",
            "danger"
          ]
        },
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false,
      "id": "TextCallout"
    },
    "CodeBlock": {
      "type": "object",
      "properties": {
        "language": {
          "type": "string"
        },
        "codeString": {
          "type": "string"
        }
      },
      "required": [
        "language",
        "codeString"
      ],
      "additionalProperties": false,
      "id": "CodeBlock"
    },
    "Image": {
      "type": "object",
      "properties": {
        "alt": {
          "type": "string"
        },
        "src": {
          "type": "string"
        }
      },
      "required": [
        "alt"
      ],
      "additionalProperties": false,
      "id": "Image"
    },
    "ImageBlock": {
      "type": "object",
      "properties": {
        "src": {
          "type": "string"
        },
        "alt": {
          "type": "string"
        }
      },
      "required": [
        "src"
      ],
      "additionalProperties": false,
      "id": "ImageBlock"
    },
    "ImageGallery": {
      "type": "object",
      "properties": {
        "images": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "src": {
                "type": "string"
              },
              "alt": {
                "type": "string"
              },
              "details": {
                "type": "string"
              }
            },
            "required": [
              "src"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "images"
      ],
      "additionalProperties": false,
      "id": "ImageGallery"
    },
    "Separator": {
      "type": "object",
      "properties": {
        "orientation": {
          "type": "string",
          "enum": [
            "horizontal",
            "vertical"
          ]
        },
        "decorative": {
          "type": "boolean"
        }
      },
      "additionalProperties": false,
      "id": "Separator"
    },
    "HorizontalBarChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "series": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Series"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "grouped",
            "stacked"
          ]
        },
        "xLabel": {
          "type": "string"
        },
        "yLabel": {
          "type": "string"
        }
      },
      "required": [
        "labels",
        "series"
      ],
      "additionalProperties": false,
      "id": "HorizontalBarChart"
    },
    "Series": {
      "type": "object",
      "properties": {
        "category": {
          "type": "string"
        },
        "values": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "category",
        "values"
      ],
      "additionalProperties": false,
      "id": "Series"
    },
    "RadarChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "series": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Series"
          }
        }
      },
      "required": [
        "labels",
        "series"
      ],
      "additionalProperties": false,
      "id": "RadarChart"
    },
    "PieChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "values": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "pie",
            "donut"
          ]
        },
        "appearance": {
          "type": "string",
          "enum": [
            "circular",
            "semiCircular"
          ]
        }
      },
      "required": [
        "labels",
        "values"
      ],
      "additionalProperties": false,
      "id": "PieChart"
    },
    "RadialChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "values": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "labels",
        "values"
      ],
      "additionalProperties": false,
      "id": "RadialChart"
    },
    "SingleStackedBarChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "values": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "labels",
        "values"
      ],
      "additionalProperties": false,
      "id": "SingleStackedBarChart"
    },
    "ScatterChart": {
      "type": "object",
      "properties": {
        "datasets": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/ScatterSeries"
          }
        },
        "xLabel": {
          "type": "string"
        },
        "yLabel": {
          "type": "string"
        }
      },
      "required": [
        "datasets"
      ],
      "additionalProperties": false,
      "id": "ScatterChart"
    },
    "ScatterSeries": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "points": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Point"
          }
        }
      },
      "required": [
        "name",
        "points"
      ],
      "additionalProperties": false,
      "id": "ScatterSeries"
    },
    "Point": {
      "type": "object",
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "z": {
          "type": "number"
        }
      },
      "required": [
        "x",
        "y"
      ],
      "additionalProperties": false,
      "id": "Point"
    },
    "AreaChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "series": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Series"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "linear",
            "natural",
            "step"
          ]
        },
        "xLabel": {
          "type": "string"
        },
        "yLabel": {
          "type": "string"
        }
      },
      "required": [
        "labels",
        "series"
      ],
      "additionalProperties": false,
      "id": "AreaChart"
    },
    "BarChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "series": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Series"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "grouped",
            "stacked"
          ]
        },
        "xLabel": {
          "type": "string"
        },
        "yLabel": {
          "type": "string"
        }
      },
      "required": [
        "labels",
        "series"
      ],
      "additionalProperties": false,
      "id": "BarChart"
    },
    "LineChart": {
      "type": "object",
      "properties": {
        "labels": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "series": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Series"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "linear",
            "natural",
            "step"
          ]
        },
        "xLabel": {
          "type": "string"
        },
        "yLabel": {
          "type": "string"
        }
      },
      "required": [
        "labels",
        "series"
      ],
      "additionalProperties": false,
      "id": "LineChart"
    },
    "Table": {
      "type": "object",
      "properties": {
        "columns": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Col"
          }
        }
      },
      "required": [
        "columns"
      ],
      "additionalProperties": false,
      "id": "Table"
    },
    "Col": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "data": {},
        "type": {
          "type": "string",
          "enum": [
            "string",
            "number",
            "action"
          ]
        }
      },
      "required": [
        "label",
        "data"
      ],
      "additionalProperties": false,
      "id": "Col"
    },
    "TagBlock": {
      "type": "object",
      "properties": {
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "required": [
        "tags"
      ],
      "additionalProperties": false,
      "id": "TagBlock"
    },
    "Form": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "buttons": {
          "$ref": "#/$defs/Buttons"
        },
        "fields": {
          "default": [],
          "type": "array",
          "items": {
            "$ref": "#/$defs/FormControl"
          }
        }
      },
      "required": [
        "name",
        "buttons",
        "fields"
      ],
      "additionalProperties": false,
      "id": "Form"
    },
    "Buttons": {
      "type": "object",
      "properties": {
        "buttons": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/Button"
          }
        },
        "direction": {
          "type": "string",
          "enum": [
            "row",
            "column"
          ]
        }
      },
      "required": [
        "buttons"
      ],
      "additionalProperties": false,
      "id": "Buttons"
    },
    "Button": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "action": {},
        "variant": {
          "type": "string",
          "enum": [
            "primary",
            "secondary",
            "tertiary"
          ]
        },
        "type": {
          "type": "string",
          "enum": [
            "normal",
            "destructive"
          ]
        },
        "size": {
          "type": "string",
          "enum": [
            "extra-small",
            "small",
            "medium",
            "large"
          ]
        }
      },
      "required": [
        "label"
      ],
      "additionalProperties": false,
      "id": "Button"
    },
    "FormControl": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "input": {
          "anyOf": [
            {
              "$ref": "#/$defs/Input"
            },
            {
              "$ref": "#/$defs/TextArea"
            },
            {
              "$ref": "#/$defs/Select"
            },
            {
              "$ref": "#/$defs/DatePicker"
            },
            {
              "$ref": "#/$defs/Slider"
            },
            {
              "$ref": "#/$defs/CheckBoxGroup"
            },
            {
              "$ref": "#/$defs/RadioGroup"
            }
          ]
        },
        "hint": {
          "type": "string"
        }
      },
      "required": [
        "label",
        "input"
      ],
      "additionalProperties": false,
      "id": "FormControl"
    },
    "Input": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "placeholder": {
          "type": "string"
        },
        "type": {
          "type": "string",
          "enum": [
            "text",
            "email",
            "password",
            "number",
            "url"
          ]
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false,
      "id": "Input"
    },
    "TextArea": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "placeholder": {
          "type": "string"
        },
        "rows": {
          "type": "number"
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false,
      "id": "TextArea"
    },
    "Select": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/SelectItem"
          }
        },
        "placeholder": {
          "type": "string"
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "string"
        },
        "size": {
          "type": "string",
          "enum": [
            "small",
            "medium",
            "large"
          ]
        }
      },
      "required": [
        "name",
        "items"
      ],
      "additionalProperties": false,
      "id": "Select"
    },
    "SelectItem": {
      "type": "object",
      "properties": {
        "value": {
          "type": "string"
        },
        "label": {
          "type": "string"
        }
      },
      "required": [
        "value",
        "label"
      ],
      "additionalProperties": false,
      "id": "SelectItem"
    },
    "DatePicker": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "mode": {
          "type": "string",
          "enum": [
            "single",
            "range"
          ]
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {}
      },
      "required": [
        "name"
      ],
      "additionalProperties": false,
      "id": "DatePicker"
    },
    "Slider": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "variant": {
          "type": "string",
          "enum": [
            "continuous",
            "discrete"
          ]
        },
        "min": {
          "type": "number"
        },
        "max": {
          "type": "number"
        },
        "step": {
          "type": "number"
        },
        "defaultValue": {
          "type": "array",
          "items": {
            "type": "number"
          }
        },
        "label": {
          "type": "string"
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "required": [
        "name",
        "variant",
        "min",
        "max"
      ],
      "additionalProperties": false,
      "id": "Slider"
    },
    "CheckBoxGroup": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/CheckBoxItem"
          }
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "boolean"
          }
        }
      },
      "required": [
        "name",
        "items"
      ],
      "additionalProperties": false,
      "id": "CheckBoxGroup"
    },
    "CheckBoxItem": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "defaultChecked": {
          "type": "boolean"
        }
      },
      "required": [
        "label",
        "description",
        "name"
      ],
      "additionalProperties": false,
      "id": "CheckBoxItem"
    },
    "RadioGroup": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/RadioItem"
          }
        },
        "defaultValue": {
          "type": "string"
        },
        "rules": {
          "type": "object",
          "properties": {
            "required": {
              "type": "boolean"
            },
            "email": {
              "type": "boolean"
            },
            "url": {
              "type": "boolean"
            },
            "numeric": {
              "type": "boolean"
            },
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "minLength": {
              "type": "number"
            },
            "maxLength": {
              "type": "number"
            },
            "pattern": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "name",
        "items"
      ],
      "additionalProperties": false,
      "id": "RadioGroup"
    },
    "RadioItem": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "value": {
          "type": "string"
        }
      },
      "required": [
        "label",
        "description",
        "value"
      ],
      "additionalProperties": false,
      "id": "RadioItem"
    },
    "Steps": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/StepsItem"
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false,
      "id": "Steps"
    },
    "StepsItem": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "details": {
          "type": "string"
        }
      },
      "required": [
        "title",
        "details"
      ],
      "additionalProperties": false,
      "id": "StepsItem"
    },
    "Tabs": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/TabItem"
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false,
      "id": "Tabs"
    },
    "TabItem": {
      "type": "object",
      "properties": {
        "value": {
          "type": "string"
        },
        "trigger": {
          "type": "string"
        },
        "content": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/TextContent"
              },
              {
                "$ref": "#/$defs/MarkDownRenderer"
              },
              {
                "$ref": "#/$defs/CardHeader"
              },
              {
                "$ref": "#/$defs/Callout"
              },
              {
                "$ref": "#/$defs/TextCallout"
              },
              {
                "$ref": "#/$defs/CodeBlock"
              },
              {
                "$ref": "#/$defs/Image"
              },
              {
                "$ref": "#/$defs/ImageBlock"
              },
              {
                "$ref": "#/$defs/ImageGallery"
              },
              {
                "$ref": "#/$defs/Separator"
              },
              {
                "$ref": "#/$defs/HorizontalBarChart"
              },
              {
                "$ref": "#/$defs/RadarChart"
              },
              {
                "$ref": "#/$defs/PieChart"
              },
              {
                "$ref": "#/$defs/RadialChart"
              },
              {
                "$ref": "#/$defs/SingleStackedBarChart"
              },
              {
                "$ref": "#/$defs/ScatterChart"
              },
              {
                "$ref": "#/$defs/AreaChart"
              },
              {
                "$ref": "#/$defs/BarChart"
              },
              {
                "$ref": "#/$defs/LineChart"
              },
              {
                "$ref": "#/$defs/Table"
              },
              {
                "$ref": "#/$defs/TagBlock"
              },
              {
                "$ref": "#/$defs/Form"
              },
              {
                "$ref": "#/$defs/Buttons"
              },
              {
                "$ref": "#/$defs/Steps"
              }
            ]
          }
        }
      },
      "required": [
        "value",
        "trigger",
        "content"
      ],
      "additionalProperties": false,
      "id": "TabItem"
    },
    "Carousel": {
      "type": "object",
      "properties": {
        "children": {
          "type": "array",
          "items": {
            "type": "array",
            "items": {
              "anyOf": [
                {
                  "$ref": "#/$defs/TextContent"
                },
                {
                  "$ref": "#/$defs/MarkDownRenderer"
                },
                {
                  "$ref": "#/$defs/CardHeader"
                },
                {
                  "$ref": "#/$defs/Callout"
                },
                {
                  "$ref": "#/$defs/TextCallout"
                },
                {
                  "$ref": "#/$defs/CodeBlock"
                },
                {
                  "$ref": "#/$defs/Image"
                },
                {
                  "$ref": "#/$defs/ImageBlock"
                },
                {
                  "$ref": "#/$defs/ImageGallery"
                },
                {
                  "$ref": "#/$defs/Separator"
                },
                {
                  "$ref": "#/$defs/HorizontalBarChart"
                },
                {
                  "$ref": "#/$defs/RadarChart"
                },
                {
                  "$ref": "#/$defs/PieChart"
                },
                {
                  "$ref": "#/$defs/RadialChart"
                },
                {
                  "$ref": "#/$defs/SingleStackedBarChart"
                },
                {
                  "$ref": "#/$defs/ScatterChart"
                },
                {
                  "$ref": "#/$defs/AreaChart"
                },
                {
                  "$ref": "#/$defs/BarChart"
                },
                {
                  "$ref": "#/$defs/LineChart"
                },
                {
                  "$ref": "#/$defs/Table"
                },
                {
                  "$ref": "#/$defs/TagBlock"
                },
                {
                  "$ref": "#/$defs/Form"
                },
                {
                  "$ref": "#/$defs/Buttons"
                },
                {
                  "$ref": "#/$defs/Steps"
                }
              ]
            }
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "card",
            "sunk"
          ]
        }
      },
      "required": [
        "children"
      ],
      "additionalProperties": false,
      "id": "Carousel"
    },
    "Stack": {
      "type": "object",
      "properties": {
        "children": {
          "type": "array",
          "items": {}
        },
        "direction": {
          "type": "string",
          "enum": [
            "row",
            "column"
          ]
        },
        "gap": {
          "type": "string",
          "enum": [
            "none",
            "xs",
            "s",
            "m",
            "l",
            "xl",
            "2xl"
          ]
        },
        "align": {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "stretch",
            "baseline"
          ]
        },
        "justify": {
          "type": "string",
          "enum": [
            "start",
            "center",
            "end",
            "between",
            "around",
            "evenly"
          ]
        },
        "wrap": {
          "type": "boolean"
        }
      },
      "required": [
        "children"
      ],
      "additionalProperties": false,
      "id": "Stack"
    },
    "Slice": {
      "type": "object",
      "properties": {
        "category": {
          "type": "string"
        },
        "value": {
          "type": "number"
        }
      },
      "required": [
        "category",
        "value"
      ],
      "additionalProperties": false,
      "id": "Slice"
    },
    "Label": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        }
      },
      "required": [
        "text"
      ],
      "additionalProperties": false,
      "id": "Label"
    },
    "SwitchGroup": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/SwitchItem"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "clear",
            "card",
            "sunk"
          ]
        },
        "value": {
          "type": "object",
          "propertyNames": {
            "type": "string"
          },
          "additionalProperties": {
            "type": "boolean"
          }
        }
      },
      "required": [
        "name",
        "items"
      ],
      "additionalProperties": false,
      "id": "SwitchGroup"
    },
    "SwitchItem": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "defaultChecked": {
          "type": "boolean"
        }
      },
      "required": [
        "name"
      ],
      "additionalProperties": false,
      "id": "SwitchItem"
    },
    "Accordion": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/AccordionItem"
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false,
      "id": "Accordion"
    },
    "AccordionItem": {
      "type": "object",
      "properties": {
        "value": {
          "type": "string"
        },
        "trigger": {
          "type": "string"
        },
        "content": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/TextContent"
              },
              {
                "$ref": "#/$defs/MarkDownRenderer"
              },
              {
                "$ref": "#/$defs/CardHeader"
              },
              {
                "$ref": "#/$defs/Callout"
              },
              {
                "$ref": "#/$defs/TextCallout"
              },
              {
                "$ref": "#/$defs/CodeBlock"
              },
              {
                "$ref": "#/$defs/Image"
              },
              {
                "$ref": "#/$defs/ImageBlock"
              },
              {
                "$ref": "#/$defs/ImageGallery"
              },
              {
                "$ref": "#/$defs/Separator"
              },
              {
                "$ref": "#/$defs/HorizontalBarChart"
              },
              {
                "$ref": "#/$defs/RadarChart"
              },
              {
                "$ref": "#/$defs/PieChart"
              },
              {
                "$ref": "#/$defs/RadialChart"
              },
              {
                "$ref": "#/$defs/SingleStackedBarChart"
              },
              {
                "$ref": "#/$defs/ScatterChart"
              },
              {
                "$ref": "#/$defs/AreaChart"
              },
              {
                "$ref": "#/$defs/BarChart"
              },
              {
                "$ref": "#/$defs/LineChart"
              },
              {
                "$ref": "#/$defs/Table"
              },
              {
                "$ref": "#/$defs/TagBlock"
              },
              {
                "$ref": "#/$defs/Form"
              },
              {
                "$ref": "#/$defs/Buttons"
              },
              {
                "$ref": "#/$defs/Steps"
              }
            ]
          }
        }
      },
      "required": [
        "value",
        "trigger",
        "content"
      ],
      "additionalProperties": false,
      "id": "AccordionItem"
    },
    "Tag": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        },
        "icon": {
          "type": "string"
        },
        "size": {
          "type": "string",
          "enum": [
            "sm",
            "md",
            "lg"
          ]
        },
        "variant": {
          "type": "string",
          "enum": [
            "neutral",
            "info",
            "success",
            "warning",
            "danger"
          ]
        }
      },
      "required": [
        "text"
      ],
      "additionalProperties": false,
      "id": "Tag"
    },
    "Modal": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "open": {
          "type": "boolean"
        },
        "children": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/TextContent"
              },
              {
                "$ref": "#/$defs/MarkDownRenderer"
              },
              {
                "$ref": "#/$defs/CardHeader"
              },
              {
                "$ref": "#/$defs/Callout"
              },
              {
                "$ref": "#/$defs/TextCallout"
              },
              {
                "$ref": "#/$defs/CodeBlock"
              },
              {
                "$ref": "#/$defs/Image"
              },
              {
                "$ref": "#/$defs/ImageBlock"
              },
              {
                "$ref": "#/$defs/ImageGallery"
              },
              {
                "$ref": "#/$defs/Separator"
              },
              {
                "$ref": "#/$defs/HorizontalBarChart"
              },
              {
                "$ref": "#/$defs/RadarChart"
              },
              {
                "$ref": "#/$defs/PieChart"
              },
              {
                "$ref": "#/$defs/RadialChart"
              },
              {
                "$ref": "#/$defs/SingleStackedBarChart"
              },
              {
                "$ref": "#/$defs/ScatterChart"
              },
              {
                "$ref": "#/$defs/AreaChart"
              },
              {
                "$ref": "#/$defs/BarChart"
              },
              {
                "$ref": "#/$defs/LineChart"
              },
              {
                "$ref": "#/$defs/Table"
              },
              {
                "$ref": "#/$defs/TagBlock"
              },
              {
                "$ref": "#/$defs/Form"
              },
              {
                "$ref": "#/$defs/Buttons"
              },
              {
                "$ref": "#/$defs/Steps"
              }
            ]
          }
        },
        "size": {
          "type": "string",
          "enum": [
            "sm",
            "md",
            "lg"
          ]
        }
      },
      "required": [
        "title",
        "children"
      ],
      "additionalProperties": false,
      "id": "Modal"
    },
    "ListBlock": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/ListItem"
          }
        },
        "variant": {
          "type": "string",
          "enum": [
            "number",
            "image"
          ]
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false,
      "id": "ListBlock"
    },
    "ListItem": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "subtitle": {
          "type": "string"
        },
        "image": {
          "type": "object",
          "properties": {
            "src": {
              "type": "string"
            },
            "alt": {
              "type": "string"
            }
          },
          "required": [
            "src",
            "alt"
          ],
          "additionalProperties": false
        },
        "actionLabel": {
          "type": "string"
        },
        "action": {}
      },
      "required": [
        "title"
      ],
      "additionalProperties": false,
      "id": "ListItem"
    },
    "FollowUpBlock": {
      "type": "object",
      "properties": {
        "items": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/FollowUpItem"
          }
        }
      },
      "required": [
        "items"
      ],
      "additionalProperties": false,
      "id": "FollowUpBlock"
    },
    "FollowUpItem": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string"
        }
      },
      "required": [
        "text"
      ],
      "additionalProperties": false,
      "id": "FollowUpItem"
    },
    "SectionBlock": {
      "type": "object",
      "properties": {
        "sections": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/SectionItem"
          }
        },
        "isFoldable": {
          "type": "boolean"
        }
      },
      "required": [
        "sections"
      ],
      "additionalProperties": false,
      "id": "SectionBlock"
    },
    "SectionItem": {
      "type": "object",
      "properties": {
        "value": {
          "type": "string"
        },
        "trigger": {
          "type": "string"
        },
        "content": {
          "type": "array",
          "items": {
            "anyOf": [
              {
                "$ref": "#/$defs/TextContent"
              },
              {
                "$ref": "#/$defs/MarkDownRenderer"
              },
              {
                "$ref": "#/$defs/CardHeader"
              },
              {
                "$ref": "#/$defs/Callout"
              },
              {
                "$ref": "#/$defs/TextCallout"
              },
              {
                "$ref": "#/$defs/CodeBlock"
              },
              {
                "$ref": "#/$defs/Image"
              },
              {
                "$ref": "#/$defs/ImageBlock"
              },
              {
                "$ref": "#/$defs/ImageGallery"
              },
              {
                "$ref": "#/$defs/Separator"
              },
              {
                "$ref": "#/$defs/HorizontalBarChart"
              },
              {
                "$ref": "#/$defs/RadarChart"
              },
              {
                "$ref": "#/$defs/PieChart"
              },
              {
                "$ref": "#/$defs/RadialChart"
              },
              {
                "$ref": "#/$defs/SingleStackedBarChart"
              },
              {
                "$ref": "#/$defs/ScatterChart"
              },
              {
                "$ref": "#/$defs/AreaChart"
              },
              {
                "$ref": "#/$defs/BarChart"
              },
              {
                "$ref": "#/$defs/LineChart"
              },
              {
                "$ref": "#/$defs/Table"
              },
              {
                "$ref": "#/$defs/TagBlock"
              },
              {
                "$ref": "#/$defs/Form"
              },
              {
                "$ref": "#/$defs/Buttons"
              },
              {
                "$ref": "#/$defs/Steps"
              },
              {
                "$ref": "#/$defs/ListBlock"
              },
              {
                "$ref": "#/$defs/FollowUpBlock"
              }
            ]
          }
        }
      },
      "required": [
        "value",
        "trigger",
        "content"
      ],
      "additionalProperties": false,
      "id": "SectionItem"
    },
    "Diagram": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "label": {
                "type": "string"
              },
              "description": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "label"
            ],
            "additionalProperties": false
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "from": {
                "type": "string"
              },
              "to": {
                "type": "string"
              },
              "label": {
                "type": "string"
              }
            },
            "required": [
              "from",
              "to"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "title",
        "nodes",
        "edges"
      ],
      "additionalProperties": false,
      "id": "Diagram"
    },
    "StepThrough": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "steps": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "heading": {
                "type": "string"
              },
              "body": {
                "type": "string"
              },
              "highlight": {
                "type": "string"
              }
            },
            "required": [
              "heading",
              "body"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "title",
        "steps"
      ],
      "additionalProperties": false,
      "id": "StepThrough"
    },
    "Quiz": {
      "type": "object",
      "properties": {
        "question": {
          "type": "string"
        },
        "choices": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "label": {
                "type": "string"
              }
            },
            "required": [
              "id",
              "label"
            ],
            "additionalProperties": false
          }
        },
        "correctChoiceId": {
          "type": "string"
        },
        "explanation": {
          "type": "string"
        }
      },
      "required": [
        "question",
        "choices",
        "correctChoiceId",
        "explanation"
      ],
      "additionalProperties": false,
      "id": "Quiz"
    },
    "Simulation": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "parameters": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "label": {
                "type": "string"
              },
              "min": {
                "type": "number"
              },
              "max": {
                "type": "number"
              },
              "step": {
                "type": "number"
              },
              "defaultValue": {
                "type": "number"
              }
            },
            "required": [
              "id",
              "label",
              "min",
              "max",
              "step",
              "defaultValue"
            ],
            "additionalProperties": false
          }
        },
        "formula": {
          "type": "string"
        }
      },
      "required": [
        "title",
        "description",
        "parameters",
        "formula"
      ],
      "additionalProperties": false,
      "id": "Simulation"
    },
    "FormulaStepper": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "terms": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "expression": {
                "type": "string"
              },
              "note": {
                "type": "string"
              }
            },
            "required": [
              "expression"
            ],
            "additionalProperties": false
          }
        }
      },
      "required": [
        "title",
        "terms"
      ],
      "additionalProperties": false,
      "id": "FormulaStepper"
    },
    "Math": {
      "type": "object",
      "properties": {
        "latex": {
          "type": "string"
        },
        "display": {
          "type": "boolean"
        }
      },
      "required": [
        "latex"
      ],
      "additionalProperties": false,
      "id": "Math"
    },
    "ImageUpload": {
      "type": "object",
      "properties": {
        "label": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "multiple": {
          "type": "boolean"
        },
        "maxFiles": {
          "type": "integer",
          "minimum": 1,
          "maximum": 12
        }
      },
      "additionalProperties": false,
      "id": "ImageUpload"
    }
  }
} as const;

/** Every component name the model is allowed to use, for logging/debugging. */
export const OPENUI_COMPONENT_NAMES = [
  "Accordion",
  "AccordionItem",
  "AreaChart",
  "BarChart",
  "Button",
  "Buttons",
  "Callout",
  "Card",
  "CardHeader",
  "Carousel",
  "CheckBoxGroup",
  "CheckBoxItem",
  "CodeBlock",
  "Col",
  "DatePicker",
  "Diagram",
  "FollowUpBlock",
  "FollowUpItem",
  "Form",
  "FormControl",
  "FormulaStepper",
  "HorizontalBarChart",
  "Image",
  "ImageBlock",
  "ImageGallery",
  "ImageUpload",
  "Input",
  "Label",
  "LineChart",
  "ListBlock",
  "ListItem",
  "MarkDownRenderer",
  "Math",
  "Modal",
  "PieChart",
  "Point",
  "Quiz",
  "RadarChart",
  "RadialChart",
  "RadioGroup",
  "RadioItem",
  "ScatterChart",
  "ScatterSeries",
  "SectionBlock",
  "SectionItem",
  "Select",
  "SelectItem",
  "Separator",
  "Series",
  "Simulation",
  "SingleStackedBarChart",
  "Slice",
  "Slider",
  "Stack",
  "StepThrough",
  "Steps",
  "StepsItem",
  "SwitchGroup",
  "SwitchItem",
  "TabItem",
  "Table",
  "Tabs",
  "Tag",
  "TagBlock",
  "TextArea",
  "TextCallout",
  "TextContent"
] as const;

/** The library's designated root component type (see library.root). */
export const OPENUI_ROOT_COMPONENT = "Stack";
