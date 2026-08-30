import Script from "next/script";

export default function PaketlerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="packages-intro-pending" strategy="beforeInteractive">
        {`if(window.location.pathname==="/paketler"){document.documentElement.classList.add("packages-intro-pending");}`}
      </Script>
      {children}
    </>
  );
}
