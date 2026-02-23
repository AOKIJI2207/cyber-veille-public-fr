export const metadata = {
  title: "Veille cyber – Service public FR",
  description: "Veille des menaces cyber sur le secteur public français"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: "#fafafa" }}>
        {children}
      </body>
    </html>
  );
}
