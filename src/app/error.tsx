"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Bir sorun oluştu.</h1>
      <p>Lütfen yeniden deneyin.</p>
      <button className="button" onClick={reset}>
        Tekrar dene
      </button>
    </div>
  );
}
