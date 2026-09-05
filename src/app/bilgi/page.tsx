export const metadata = { title: "Bu mağaza hakkında" };
export default function Info() {
  return (
    <article className="wrap page narrow prose">
      <p className="eyebrow">AÇIK KAYNAK BAŞLANGIÇ PROJESİ</p>
      <h1 className="page-title">Doku hakkında.</h1>
      <p>
        Doku, Türkiye E-ticaret Starter için hazırlanmış örnek bir markadır.
        Katalogdaki ürünler ve ürün görselleri gösterim amaçlıdır.
      </p>
      <h2>Ödeme nasıl çalışır?</h2>
      <p>
        Demo modunda kart bilgisi veya gerçek ödeme alınmaz. PayTR modunda ödeme
        formu PayTR tarafından sunulur. Siparişin ödenmiş sayılması için
        sunucuya gelen imzalı ödeme bildiriminin doğrulanması gerekir.
      </p>
      <h2>Sipariş takibi</h2>
      <p>
        Siparişinizi oluşturduğunuz tarayıcıdan sipariş bağlantısını
        açabilirsiniz. Bu başlangıç sürümünde müşteri hesabı veya e-posta
        bildirimi bulunmaz.
      </p>
      <h2>Kargo ve fiyatlar</h2>
      <p>
        Örnek fiyatlar KDV dahildir. Kargo ücreti 79,90 TL, ücretsiz kargo eşiği
        1.500 TL olarak yapılandırılmıştır.
      </p>
      <p>
        Gerçek mağazaya dönüşüm ve dağıtım adımları GitHub deposundaki kurulum
        rehberinde açıklanır.
      </p>
    </article>
  );
}
