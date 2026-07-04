import ItpcIntakePage, { ItpcLiteTab } from '../agency/ItpcIntakePage';

export default function ItpcLitePortalPage({ tab = 'interest' }: { tab?: ItpcLiteTab }) {
  return <ItpcIntakePage mode="lite" liteTab={tab} />;
}
