import Navbar from "./Navbar";

export default function ProtectedLayout({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>{children}</div>
    </>
  );
}
