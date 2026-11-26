import Board from '@/components/Board';
import Explainer from '@/components/Explainer';
import SiteFooter from '@/components/SiteFooter';

export default function Page() {
  return (
    <div className="min-h-dvh">
      <Board />
      <Explainer />
      <SiteFooter />
    </div>
  );
}
