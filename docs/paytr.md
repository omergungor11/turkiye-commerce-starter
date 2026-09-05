# PayTR kurulumu

Resmî referanslar: [1. adım: token](https://dev.paytr.com/iframe-api/iframe-api-1-adim), [2. adım: bildirim](https://dev.paytr.com/iframe-api/iframe-api-2-adim).

1. PayTR mağaza hesabınızdan merchant ID, key ve salt değerlerini alın.
2. `.env.local`: `PAYMENT_PROVIDER=paytr`, `PAYTR_TEST_MODE=1`, `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT` ayarlayın. Anahtarlar yalnızca sunucudadır; `NEXT_PUBLIC_` kullanmayın.
3. `APP_URL` erişilebilir HTTPS origin olmalıdır; ör. `https://shop.example.com` (yol ve sondaki eğik çizgi olmadan). Yerel merchant testi için HTTPS tüneli gerekir. Tarayıcıdan da bu adresi açın.
4. PayTR panelinde bildirim adresini `https://shop.example.com/api/paytr/callback` tanımlayın; PayTR sunucusundan erişilebilir olmalıdır.
5. Testte `PAYTR_TEST_USER_IP` için geçerli genel IP kullanılabilir. Canlıda yalnızca `X-Forwarded-For` başlığını kendisi yeniden yazan güvenilir reverse proxy arkasında `TRUST_PROXY=true` ayarlayın.
6. Sunucuyu yeniden başlatın. PayTR’ın mağazanız için sağladığı test bilgileriyle başarı, başarısızlık ve 3D Secure akışlarını doğrulayın.

## İşleyiş

Token imzası, sağlayıcının belirttiği alan sırasıyla HMAC-SHA256 üretilir. Tutar kuruş, sepet satırı fiyatı iki ondalıklı TL’dir. Kargo ayrı satırdır. `no_installment=1`, `max_installment=0` ile tek çekim kullanılır.

Callback imzası `merchant_oid + merchant_salt + status + total_amount` üzerinden doğrulanır. Ardından kayıtlı ödeme modu ve başarı tutarı kontrol edilir. Veritabanı işlemi tamamlanınca tam olarak `OK` döner. Aynı bildirim ikinci stok değişikliği yapmaz. Çelişkili sonuç kabul edilmez.

Tarayıcı başarı/başarısızlık dönüşleri aynı sipariş sayfasına gider; tarayıcı dönüşü ödeme kanıtı değildir. Token yalnızca sipariş sahibinin çereziyle görüntülenir. Callback kullanıcı oturumu gerektirmez.

## Bekleyen işlemler

Token isteği zaman aşımına uğrarsa sağlayıcı işlemi almış olabilir. Sipariş beklemede ve stok rezerve kalır; otomatik yeniden token isteği gönderilmez. Sayfa mağazayla iletişim mesajı gösterir.

Canlı mağaza için sağlayıcı durum sorgusu ve mutabakat işi ekleyin. Ödeme olmadığını doğrulamadan yalnızca geçen süreye bakarak stok bırakmayın. Bu sürümde bekleyen ödemeyi admin’den “ödendi” işaretleme veya otomatik iptal yoktur. Merchant anahtarlarını/modunu bekleyen işlemler varken değiştirmek callback kabulünü etkileyebilir; önce işlemleri sonuçlandırın.

Canlı hesap onayı ve sandbox doğrulaması sonrasında `PAYTR_TEST_MODE=0` kullanın. HTTPS, güvenilir proxy ve kalıcı depolama gerekir. Demo ödeme endpoint’i PayTR sağlayıcısı aktifken kapalıdır; test siparişleri canlı tahsilat toplamına katılmaz.

Bu repoda yerel token/imza fixture’ları, callback handler ve demo alışverişi test edilir. Gerçek banka, tahsilat ve iade bu testlerin kapsamında değildir.
