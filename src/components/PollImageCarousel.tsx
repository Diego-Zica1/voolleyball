import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type PollOption } from "@/lib/polls";

interface PollImageCarouselProps {
  options: PollOption[];
  className?: string;
}

export function PollImageCarousel({ options, className = "" }: PollImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filtrar apenas opções que têm imagem
  const optionsWithImages = options.filter(option => option.image_url);
  
  // Se não há imagens, não renderizar o carrossel
  if (optionsWithImages.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % optionsWithImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? optionsWithImages.length - 1 : prev - 1
    );
  };

  const currentOption = optionsWithImages[currentIndex];

  return (
    <div className={`relative w-full max-w-md mx-auto mb-4 ${className}`}>
      <div className="relative">
        <img
          src={currentOption.image_url}
          alt={currentOption.name}
          className="max-w-[131px] max-h-[131px] mx-auto object-contain rounded-lg"
        />
        
        {/* Botões de navegação */}
        {optionsWithImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 dark:bg-[#020817] dark:hover:bg-[#876ff3] bg-[#876ff3] hover:bg-[#d2c8ff]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 dark:bg-[#020817] dark:hover:bg-[#876ff3] bg-[#876ff3] hover:bg-[#d2c8ff]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Indicadores de posição (bullets) - AGORA ABAIXO DA IMAGEM */}
      {optionsWithImages.length > 1 && (
        <div className="flex justify-center mt-3 space-x-1">
          {optionsWithImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#876ff3]' : 'bg-[#020817]'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Título da opção atual */}
      <div className="text-center mt-4 ">
        <h4 className="font-medium text-lg ">{currentOption.name}</h4>
        {/* Divisória logo após o título */}
        <hr className="my-4 border-t border-gray-200 dark:border-gray-700" />
      </div>
    </div>
  );
}
