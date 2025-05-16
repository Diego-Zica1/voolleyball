
import React, { useRef, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ScoreboardMenu } from "@/components/ScoreboardMenu";

export default function ScoreboardPage() {
  const scoreboardRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <>
      {/* Menu de controles (visível apenas quando não estiver em fullscreen ou quando showControls for true) */}
      {showControls && (
        <PageContainer title="Placar">
          <div className="text-center">
            <p className="mt-4 text-muted-foreground">
              Configure o placar conforme necessário. Clique no botão de tela cheia para exibir somente o placar.
            </p>
          </div>
        </PageContainer>
      )}
      
      {/* Placar principal (referenciado para o modo tela cheia) */}
      <div 
        ref={scoreboardRef}
        className={`${showControls ? 'mt-8 bg-volleyball-purple/5 p-8 rounded-lg w-full' : 'fixed inset-0 z-40 bg-gradient-to-br from-black to-volleyball-purple-900 flex items-center justify-center'}`}
      >
        <div className={`w-full max-w-5xl mx-auto ${!showControls && 'p-8'}`}>
          <div className="flex flex-col md:flex-row justify-between gap-8">
            {/* Time A */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
              <h2 className="text-2xl md:text-4xl font-bold mb-6">TIME A</h2>
              <div className="text-6xl md:text-8xl font-bold text-volleyball-purple">0</div>
            </div>
            
            {/* Informações do Set */}
            <div className="flex flex-col justify-center items-center">
              <div className="text-xl md:text-3xl font-semibold mb-4 text-center">SET 1</div>
              <div className="flex gap-2 md:gap-4">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-gray-300"></div>
              </div>
            </div>
            
            {/* Time B */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg text-center">
              <h2 className="text-2xl md:text-4xl font-bold mb-6">TIME B</h2>
              <div className="text-6xl md:text-8xl font-bold text-volleyball-green">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu flutuante sempre visível */}
      <ScoreboardMenu 
        scoreboardRef={scoreboardRef}
        onToggleMenu={toggleControls}
      />
    </>
  );
}
