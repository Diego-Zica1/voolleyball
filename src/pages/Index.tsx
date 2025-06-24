
import { PageContainer } from "@/components/PageContainer";
import { PollDisplay } from "@/components/PollDisplay";

export default function Index() {
  return (
    <PageContainer 
      title="Bem-vindo ao Volleyball Club!"
      description="Aqui você pode confirmar sua presença nos jogos, ver os times e muito mais."
    >
      <div className="space-y-8">
        <PollDisplay />
      </div>
    </PageContainer>
  );
}
