# Vitest Unit Testing Examples

A hands-on learning reference repository for **Vitest** and unit testing concepts. Every file is a mini-lesson — clean, well-commented, and focused on one concept at a time.

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run all tests once
npm test

# 3. Run tests in watch mode (re-runs on file save)
npm run test:watch

# 4. Open the visual UI dashboard
npm run test:ui

# 5. Generate a coverage report
npm run coverage
```

---

## 📁 Project Structure

```
src/
├── 01-basics/           Basic test anatomy: describe, it, expect
├── 02-matchers/         Full tour of Vitest matchers
├── 03-better-tests/     Writing clear, maintainable tests
├── 04-each/             Parameterized tests with it.each
├── 05-async/            Testing async/await and Promises
├── 06-tdd/              Test-Driven Development (Red→Green→Refactor)
├── 07-asymmetric-matchers/  Handling dynamic, unpredictable values
├── 08-mocks/            Mocking dependencies with vi.mock / vi.fn
├── 09-spies/            Observing calls with vi.spyOn
├── 10-setup-teardown/   beforeEach, afterEach, beforeAll, afterAll
└── 11-integration/      Testing multiple modules working together
```

---

## 📌 Sections

### 01 — Basics

**File:** `src/01-basics/math.js` + `math.test.js`

The anatomy of a Vitest test file. Covers the three building blocks every test uses:

- **`describe()`** — groups related tests together (like a folder)
- **`it()` / `test()`** — defines a single test case (they are identical)
- **`expect()`** — makes an assertion about a value

Also covers testing that a function **throws an error** with `expect(() => fn()).toThrow()`.

```bash
npx vitest run src/01-basics
```

---

### 02 — Matchers

**File:** `src/02-matchers/matchers-demo.js` + `matchers-demo.test.js`

A guided tour of Vitest's built-in matchers. Each group covers a different category:

| Matcher | Use for |
|---|---|
| `toBe` | Strict equality for primitives (`===`) |
| `toEqual` | Deep equality for objects and arrays |
| `toBeTruthy` / `toBeFalsy` | Truthy/falsy checks |
| `toBeNull` / `toBeUndefined` | Null/undefined checks |
| `toBeDefined` | Anything that is not undefined |
| `toBeGreaterThan` / `toBeLessThan` | Number comparisons |
| `toBeCloseTo` | Floating-point numbers (avoids 0.1 + 0.2 bugs) |
| `toContain` | Array includes a value, or string includes substring |
| `toHaveLength` | Array or string length |
| `toMatch` | String matches a regex |
| `.not.` | Negates any matcher |

```bash
npx vitest run src/02-matchers
```

---

### 03 — Better Tests

**File:** `src/03-better-tests/cart.js` + `cart.test.js`

What separates a *good* test from a bad one:

1. **Intention-revealing names** — describe the behaviour, not the code path
2. **Nested `describe` blocks** — mirror the structure of the feature
3. **Arrange / Act / Assert (AAA)** — a clear structure inside each test
4. **State isolation** — use `beforeEach` to create a fresh instance per test
5. **One concept per test** — don't mix multiple concerns

```bash
npx vitest run src/03-better-tests
```

---

### 04 — `it.each`

**File:** `src/04-each/validators.js` + `validators.test.js`

When you find yourself copy-pasting the same test with different values, reach for `it.each`. It lets you define a table of inputs and expected outputs and run the same assertion for each row.

Two syntax styles are shown:

**Array syntax:**
```js
it.each([
  [2,  true],
  [3,  false],
])('isEven(%i) returns %s', (input, expected) => {
  expect(isEven(input)).toBe(expected);
});
```

**Object table syntax** (more readable for complex cases):
```js
it.each([
  { input: 1, expected: true, description: 'positive number' },
])('isPositive($input) — $description', ({ input, expected }) => {
  expect(isPositive(input)).toBe(expected);
});
```

```bash
npx vitest run src/04-each
```

---

### 05 — Async

**File:** `src/05-async/fetchUser.js` + `fetchUser.test.js`

Three styles for testing asynchronous code, with comments on the differences:

1. **`async/await`** (recommended) — mark test as `async`, await the call
2. **Return a Promise** — classic style, just return the `.then()` chain
3. **`.resolves` / `.rejects` matchers** — declarative, unwraps the promise for you

> ⚠️ **Common mistake:** Forgetting to `await` or `return` a promise causes the test to finish before the assertion runs — making a broken test pass silently.

```bash
npx vitest run src/05-async
```

---

### 06 — TDD (Test-Driven Development)

**File:** `src/06-tdd/stringUtils.js` + `stringUtils.test.js`

TDD is a development technique where you write the **test before the code**. The cycle:

```
🔴 RED     → Write a failing test (the code doesn't exist yet)
🟢 GREEN   → Write the minimum code to make it pass
🔵 REFACTOR → Clean up without breaking the tests
```

The test file is annotated with `🔴 RED` / `🔵 REFACTOR` comments to show which phase each test was written in. The key benefit: you're forced to think about **what** the code should do before thinking about **how** to implement it.

```bash
npx vitest run src/06-tdd
```

---

### 07 — Asymmetric Matchers

**File:** `src/07-asymmetric-matchers/dynamicData.js` + `dynamicData.test.js`

When a function returns dynamic values (auto-generated IDs, timestamps, random numbers), you can't hardcode expected values. Asymmetric matchers let you assert on the **shape and type** without knowing the exact value:

| Matcher | What it checks |
|---|---|
| `expect.any(Number)` | Value is a number (any number) |
| `expect.stringContaining('ORD-')` | String includes this substring |
| `expect.arrayContaining(['a', 'b'])` | Array includes at least these elements |
| `expect.objectContaining({ role: 'user' })` | Object has at least these properties |

These can be **combined** inside `toEqual` for complex object shapes:
```js
expect(user).toEqual({
  id: expect.any(Number),
  name: 'Alice',
  createdAt: expect.any(String),
});
```

```bash
npx vitest run src/07-asymmetric-matchers
```

---

### 08 — Mocks

**File:** `src/08-mocks/userService.js` + `db.js` + `userService.test.js`

A **mock** completely replaces a dependency so your test never runs its real code. This isolates your module from databases, APIs, and other external systems.

Key concepts shown:

```js
vi.mock('./db.js')               // Replace the whole module with fakes
mockFn.mockResolvedValue(data)   // Control what it returns
mockFn.mockRejectedValue(error)  // Simulate an error

expect(fn).toHaveBeenCalled()          // Was it called at all?
expect(fn).toHaveBeenCalledTimes(1)    // Exactly once?
expect(fn).toHaveBeenCalledWith(args)  // With the right arguments?
expect(fn).not.toHaveBeenCalled()      // Was it correctly NOT called?
```

```bash
npx vitest run src/08-mocks
```

---

### 09 — Spies

**File:** `src/09-spies/logger.js` + `notificationService.js` + `notificationService.test.js`

A **spy** wraps an existing function and records calls to it — unlike a mock, the **real implementation still runs** (by default).

| | Mock (`vi.fn` / `vi.mock`) | Spy (`vi.spyOn`) |
|---|---|---|
| Real code runs? | ❌ No | ✅ Yes (by default) |
| Records calls? | ✅ Yes | ✅ Yes |
| Controls return value? | ✅ Yes | ✅ Yes (optional) |
| Use when... | You want full isolation | You want to observe side effects |

```js
const spy = vi.spyOn(logger, 'info').mockImplementation(() => {});
// ^ wraps logger.info, suppresses output, records calls

expect(spy).toHaveBeenCalledWith(expect.stringContaining('alice@'));
vi.restoreAllMocks(); // Put the original back
```

```bash
npx vitest run src/09-spies
```

---

### 10 — Setup & Teardown

**File:** `src/10-setup-teardown/counter.js` + `counter.test.js`

Lifecycle hooks let you run code before and after tests to manage shared state:

| Hook | When it runs | Common use |
|---|---|---|
| `beforeAll` | Once before the entire suite | Connect to DB, start server |
| `afterAll` | Once after the entire suite | Close DB, stop server |
| `beforeEach` | Before every single test | Reset state, fresh instance |
| `afterEach` | After every single test | Clear mocks, delete temp data |

> **Why isolation matters:** If test A increments a counter and test B checks the initial value, B fails — not because the code is wrong, but because A left dirty state. `beforeEach` solves this.

Hooks can be scoped to nested `describe` blocks. Order of execution:
```
outer beforeEach → inner beforeEach → test → inner afterEach → outer afterEach
```

```bash
npx vitest run src/10-setup-teardown
```

---

### 11 — Integration Tests

**File:** `src/11-integration/` → `orderService.js`, `productService.js`, `paymentService.js`, `order.test.js`

**Unit tests** isolate a single function/module with all dependencies mocked.
**Integration tests** let multiple real modules interact — no mocking — to verify they work correctly *together*.

This section tests an order flow where `orderService` calls both `productService` and `paymentService` with their real implementations. Integration tests catch bugs at the "seams" between modules that unit tests can't see.

> Notice: there are **no `vi.mock()` calls** in the integration test file. That's intentional.

```bash
npx vitest run src/11-integration
```

---

## 🖥️ Vitest UI

The Vitest UI is a browser-based dashboard for running and inspecting tests visually. It shows you which tests passed or failed, lets you filter by file or test name, and displays the full error output in a beautiful interface.

**Launch it:**
```bash
npm run test:ui
# or directly:
npx vitest --ui
```

This opens a browser window automatically. The UI is great for:
- Exploring test results while learning
- Quickly re-running individual tests
- Seeing a tree view of all your test suites

> **Note:** The UI requires `@vitest/ui` to be installed (already included in this project's `devDependencies`).

---

## 🔌 Vitest VSCode Extension

For an even better developer experience, install the **[Vitest extension for VS Code](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)**:

1. Open VS Code
2. Go to the Extensions panel (`Ctrl+Shift+X`)
3. Search for **"Vitest"** (publisher: `vitest`)
4. Click **Install**

**What it gives you:**
- ▶️ Run individual tests or suites with a click
- 🔴🟢 Inline pass/fail indicators next to each test in the editor
- 🐛 Debug tests directly in VS Code's debugger (set breakpoints, step through)
- 🔄 Auto-runs affected tests on file save

> **Note:** Both the UI and the extension are optional — `npm test` works perfectly without them. But they make learning and debugging significantly more enjoyable.

---

## 📊 Coverage (`vitest --coverage`)

Code coverage tells you which lines of your source code were actually **executed** during tests.

**Run it:**
```bash
npm run coverage
```

This generates a report in the terminal and an HTML report in the `./coverage/` folder.

**What the metrics mean:**

| Metric | What it measures |
|---|---|
| **Statements** | How many individual statements were executed |
| **Branches** | How many `if`/`else` paths were taken |
| **Functions** | How many functions were called at least once |
| **Lines** | How many lines were executed (similar to statements) |

**What good coverage looks like:**
```
File                  | % Stmts | % Branch | % Funcs | % Lines
----------------------|---------|----------|---------|--------
math.js               |   100   |   100    |   100   |   100
cart.js               |    95   |    90    |   100   |    95
```

> ⚠️ **Important:** 100% coverage does NOT guarantee bug-free code. It only means every line was *executed* during tests — not that every possible input was tested, or that the logic is correct. Coverage is a useful signal, not a goal in itself.

**View the HTML report:**
After running `npm run coverage`, open `coverage/index.html` in your browser for a line-by-line visual of which code is covered.

---

## 🛠 Tech Stack

- **[Vitest](https://vitest.dev/)** — Test runner (fast, ESModule-native, Jest-compatible API)
- **Plain JavaScript (ESModules)** — No TypeScript, no frameworks, no bundler
- **Node.js** — Tests run in a Node environment

---

## 📖 Further Reading

- [Vitest Documentation](https://vitest.dev/guide/)
- [Vitest API Reference](https://vitest.dev/api/)
- [Vitest Matchers](https://vitest.dev/api/expect.html)
- [Vi Utilities (mocks/spies)](https://vitest.dev/api/vi.html)
