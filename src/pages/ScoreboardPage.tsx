
import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ScoreboardPage() {
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [team1Name, setTeam1Name] = useState("Time A");
  const [team2Name, setTeam2Name] = useState("Time B");
  const [isEditing, setIsEditing] = useState(false);
  
  const { toast } = useToast();

  // Save/load scores from localStorage
  useEffect(() => {
    const savedScoreboard = localStorage.getItem("volleyball-scoreboard");
    if (savedScoreboard) {
      try {
        const data = JSON.parse(savedScoreboard);
        setScore1(data.score1);
        setScore2(data.score2);
        setTeam1Name(data.team1Name);
        setTeam2Name(data.team2Name);
      } catch (e) {
        console.error("Error loading saved scoreboard:", e);
      }
    }
  }, []);

  // Save scores when they change
  useEffect(() => {
    localStorage.setItem(
      "volleyball-scoreboard",
      JSON.stringify({ score1, score2, team1Name, team2Name })
    );
  }, [score1, score2, team1Name, team2Name]);

  const incrementScore = (team: 1 | 2) => {
    if (team === 1) {
      setScore1((prev) => prev + 1);
    } else {
      setScore2((prev) => prev + 1);
    }
  };

  const decrementScore = (team: 1 | 2) => {
    if (team === 1) {
      setScore1((prev) => (prev > 0 ? prev - 1 : 0));
    } else {
      setScore2((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  const resetScores = () => {
    setScore1(0);
    setScore2(0);
    toast({
      title: "Placar resetado",
      description: "O placar foi zerado com sucesso"
    });
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const saveTeamNames = () => {
    toast({
      title: "Nomes salvos",
      description: "Os nomes dos times foram atualizados"
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-4xl mt-6 mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Placar de Vôlei</h1>
        <div className="space-x-2">
          {isEditing ? (
            <Button onClick={saveTeamNames} className="volleyball-button-primary">
              Salvar Nomes
            </Button>
          ) : (
            <Button onClick={toggleEditing} variant="outline">
              Editar Nomes
            </Button>
          )}
          <Button onClick={resetScores} variant="destructive">
            Zerar
          </Button>
        </div>
      </div>

      <div className="w-full h-[calc(100vh-120px)] max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row h-full">
          {/* Team 1 */}
          <div className="flex-1 flex flex-col p-4 bg-blue-50 dark:bg-blue-900/20 border-r border-gray-200 dark:border-gray-700">
            {isEditing ? (
              <Input
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                placeholder="Nome do Time 1"
                className="mb-4 text-center text-lg font-bold"
              />
            ) : (
              <h2 className="text-center text-2xl md:text-3xl font-bold mb-4">{team1Name}</h2>
            )}
            
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="text-8xl md:text-9xl font-bold mb-8">{score1}</div>
              <div className="flex space-x-4">
                <Button
                  onClick={() => decrementScore(1)}
                  size="lg"
                  className="h-16 w-16 text-2xl bg-red-500 hover:bg-red-600"
                >
                  <Minus className="h-8 w-8" />
                </Button>
                <Button
                  onClick={() => incrementScore(1)}
                  size="lg"
                  className="h-16 w-16 text-2xl bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex-1 flex flex-col p-4 bg-purple-50 dark:bg-purple-900/20">
            {isEditing ? (
              <Input
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                placeholder="Nome do Time 2"
                className="mb-4 text-center text-lg font-bold"
              />
            ) : (
              <h2 className="text-center text-2xl md:text-3xl font-bold mb-4">{team2Name}</h2>
            )}
            
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="text-8xl md:text-9xl font-bold mb-8">{score2}</div>
              <div className="flex space-x-4">
                <Button
                  onClick={() => decrementScore(2)}
                  size="lg"
                  className="h-16 w-16 text-2xl bg-red-500 hover:bg-red-600"
                >
                  <Minus className="h-8 w-8" />
                </Button>
                <Button
                  onClick={() => incrementScore(2)}
                  size="lg"
                  className="h-16 w-16 text-2xl bg-green-500 hover:bg-green-600"
                >
                  <Plus className="h-8 w-8" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
