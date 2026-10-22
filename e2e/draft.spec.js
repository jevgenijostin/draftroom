import { test, expect } from "@playwright/test";
async function pro(page) {
  await page.getByRole("button", { name: "Unlock Pro" }).click();
  await page
    .getByRole("button", { name: "Activate free demo license" })
    .click();
  await expect(
    page.getByRole("button", { name: "DEMO PRO", exact: true }),
  ).toBeVisible();
}
async function shortDraft(page, rounds = "1") {
  await page.getByRole("button", { name: "League settings" }).click();
  await page.getByLabel("Rounds", { exact: true }).selectOption(rounds);
  await page.getByRole("button", { name: "Save league settings" }).click();
}
test.beforeEach(async ({ page }) => {
  await page.goto("/");
});
test("starts, manually drafts a player, and fills the league board", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await expect(page.getByText("YOUR PICK", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Draft Christian McCaffrey", exact: true })
    .click();
  await expect(page.getByTestId("player-rb-1")).toHaveCount(0);
  await expect(page.locator(".your-roster")).toContainText(
    "Christian McCaffrey",
  );
  await expect(
    page.locator(".roster-card").nth(1).locator(".filled"),
  ).toHaveCount(1);
});
test("clock ticks and auto-picks on expiry", async ({ page }) => {
  await page.clock.install();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await expect(page.getByTestId("clock")).toHaveText("00:30");
  await page.clock.runFor(2100);
  await expect(page.getByTestId("clock")).toHaveText("00:28");
  await page.clock.runFor(28000);
  await expect(page.locator(".your-roster .filled")).toHaveCount(1);
  await expect(page.getByText(/Clock auto-pick/)).toBeVisible();
});
test("pause freezes the clock and resume continues remaining time", async ({
  page,
}) => {
  await page.clock.install();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page.clock.runFor(5000);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const text = await page.getByTestId("clock").textContent();
  await page.clock.runFor(10000);
  await expect(page.getByTestId("clock")).toHaveText(text);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.getByTestId("clock")).not.toHaveText(text);
});
test("queue drag reorder drafts the new first priority", async ({ page }) => {
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page
    .getByRole("button", { name: "Queue Christian McCaffrey", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue CeeDee Lamb", exact: true })
    .click();
  await page.getByTestId("queue-wr-1").dragTo(page.getByTestId("queue-rb-1"));
  await expect(page.locator(".queue-item").first()).toContainText(
    "CeeDee Lamb",
  );
  await page.getByRole("button", { name: "Draft top of queue" }).click();
  await expect(page.locator(".your-roster")).toContainText("CeeDee Lamb");
  await expect(page.getByTestId("queue-wr-1")).toHaveCount(0);
});
test("keyboard reorder and removal preserve priority", async ({ page }) => {
  await page
    .getByRole("button", { name: "Queue Christian McCaffrey", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Queue CeeDee Lamb", exact: true })
    .click();
  await page.getByRole("button", { name: "Move CeeDee Lamb up" }).click();
  await expect(page.locator(".queue-item").first()).toContainText(
    "CeeDee Lamb",
  );
  await page
    .getByRole("button", { name: "Remove CeeDee Lamb from queue" })
    .click();
  await expect(page.locator(".queue-item")).toHaveCount(1);
});
test("completes a draft, shows every grade, and enforces free daily limit after reload", async ({
  page,
}) => {
  await shortDraft(page);
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page.getByRole("button", { name: "Autopilot", exact: true }).click();
  await expect(page.getByTestId("your-grade")).toBeVisible();
  await expect(page.locator(".result-team")).toHaveCount(8);
  await page.reload();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await expect(
    page.getByText(/Your free draft is used for today/).first(),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Demo Pro" })).toBeVisible();
});
test("Pro unlocks settings and history persists through reload", async ({
  page,
}) => {
  await pro(page);
  await page.getByRole("button", { name: "League settings" }).click();
  await page.getByLabel("League size", { exact: true }).selectOption("4");
  await page.getByLabel("Rounds", { exact: true }).selectOption("1");
  await page.getByLabel("QB weight").press("End");
  await page.getByRole("button", { name: "Save league settings" }).click();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page.getByRole("button", { name: "Autopilot", exact: true }).click();
  await expect(page.getByTestId("your-grade")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "History" }).click();
  await page.locator(".history-row").click();
  await expect(page.locator(".result-team")).toHaveCount(4);
  await expect(page.getByTestId("your-grade")).toBeVisible();
});
test("keeper season carries two players per team and excludes them from the pool", async ({
  page,
}) => {
  await pro(page);
  await shortDraft(page, "3");
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page.getByRole("button", { name: "Autopilot", exact: true }).click();
  await expect(page.getByTestId("your-grade")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Next keeper season" }).click();
  await expect(
    page.getByText(/Two highest-value players per team/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save league settings" }).click();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await expect(page.locator(".your-roster .filled")).toHaveCount(2);
  await expect(page.getByTestId("player-rb-1")).toHaveCount(0);
  await expect(page.locator(".roster-card .filled")).toHaveCount(16);
});

test("a full 15-round draft produces eight complete rosters", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page
    .getByRole("button", { name: "Queue CeeDee Lamb", exact: true })
    .click();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await expect(page.getByTestId("queue-wr-1")).toBeVisible();
  await page.getByRole("button", { name: "Autopilot", exact: true }).click();
  await expect(page.getByTestId("your-grade")).toBeVisible({ timeout: 45000 });
  await expect(page.locator(".result-team")).toHaveCount(8);
  await expect(page.locator(".result-player")).toHaveCount(120);
  await expect(
    page.locator(".result-team.mine .result-player").first(),
  ).toContainText("CeeDee Lamb");
  await page.screenshot({ path: "test-results/report.png", fullPage: true });
});
test("invalid license stays free; position filter and search work", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Unlock Pro" }).click();
  await page
    .getByLabel("Demo license key", { exact: true })
    .fill("DR1.invalid");
  await page.getByRole("button", { name: "Verify & activate" }).click();
  await expect(
    page.getByRole("dialog").getByText(/That license is not valid/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "QB", exact: true }).click();
  await page.getByRole("textbox", { name: "Search players" }).fill("Allen");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody")).toContainText("Josh Allen");
});
test("mobile layout stays within viewport and queue remains usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "On the clock. Own the draft." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Queue Christian McCaffrey", exact: true })
    .click();
  await expect(page.getByTestId("queue-rb-1")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("production app makes no external runtime requests or browser errors", async ({
  page,
}) => {
  const external = [],
    errors = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173")) external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.reload();
  await page.getByRole("button", { name: "Enter the draft" }).click();
  await page
    .getByRole("button", { name: "Draft Christian McCaffrey", exact: true })
    .click();
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
