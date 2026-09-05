import { test, expect } from "@playwright/test";

test("catalog → checkout → demo payment → admin fulfillment → buyer tracking", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Her güne",
  );
  await page
    .getByRole("button", { name: "Sepete ekle", exact: true })
    .first()
    .click();
  await page.getByRole("link", { name: "Sepetim, 1 ürün" }).click();
  await page.getByLabel("Ad soyad").fill("Demo Kullanıcı");
  await page.getByLabel("E-posta").fill("demo@example.com");
  await page.getByLabel("Telefon").fill("05550000000");
  await page.getByLabel("İl", { exact: true }).fill("İstanbul");
  await page.getByLabel("İlçe", { exact: true }).fill("Kadıköy");
  await page.getByLabel("Posta kodu").fill("34710");
  await page.getByLabel("Açık adres").fill("Örnek Mahallesi Test Sokak No: 1");
  await page.getByRole("button", { name: "Demo ödemeye geç" }).click();
  await expect(page).toHaveURL(/\/odeme\/TR/);
  await page
    .getByRole("button", { name: "Başarılı ödemeyi dene", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Siparişiniz alındı." }),
  ).toBeVisible();
  const orderUrl = page.url();
  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await strangerPage.goto(orderUrl);
  await expect(strangerPage.getByText("Demo Kullanıcı")).toHaveCount(0);
  await expect(
    strangerPage.getByRole("heading", { name: "Siparişiniz alındı." }),
  ).toHaveCount(0);
  await stranger.close();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Yönetici parolası").fill("test-only-admin-password");
  await page.getByRole("button", { name: "Yönetim paneline gir" }).click();
  await expect(
    page.getByRole("heading", { name: "Genel bakış." }),
  ).toBeVisible();
  await page.getByLabel("Kargo takip numarası").first().fill("DEMO123456");
  await page
    .getByRole("button", { name: "Kargoya verildi", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Kargoya verildi · DEMO123456", { exact: false }),
  ).toBeVisible();
  await page.goto(orderUrl);
  await expect(
    page.getByText("Takip no: DEMO123456", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("HTTP rejects untrusted origins and unauthenticated admin changes", async ({
  request,
}) => {
  const response = await request.patch("/api/admin/products", {
    headers: { Origin: "http://localhost:4181" },
    data: { id: "p1", name: "Unauthorized", price: 1, stock: 99, active: true },
  });
  expect(response.status()).toBe(401);
  const crossSite = await request.post("/api/session", {
    headers: { Origin: "https://attacker.example" },
  });
  expect(crossSite.status()).toBe(403);
  const forged = await request.post("/api/paytr/callback", {
    form: {
      merchant_oid: "TR123",
      status: "success",
      total_amount: "1",
      hash: "invalid",
    },
  });
  expect(forged.status()).toBe(503);
});

test("mobile catalog fits viewport and category filter works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel("Kategori", { exact: true }).selectOption("Tekstil");
  await page.getByRole("button", { name: "Filtrele" }).click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Keten");
});
