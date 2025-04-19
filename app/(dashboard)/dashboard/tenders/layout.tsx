import TendersHeader from './TendersHeader';

export default function TendersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TendersHeader />
      {children}
    </>
  );
} 