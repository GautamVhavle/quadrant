import Board from '@/components/Board';
import DecisionExplainer from '@/components/DecisionExplainer';
import Explainer from '@/components/Explainer';
import SiteFooter from '@/components/SiteFooter';

export default function Page() {
  return (
    <div className="min-h-dvh">
      <Board />
      <DecisionExplainer />
      <Explainer />
      <SiteFooter />
    </div>
  );
}
