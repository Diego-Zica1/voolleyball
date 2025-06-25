
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updatePoll, uploadPollImage, type PollWithOptions } from "@/lib/polls";
import { Loader2, Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

interface PollOption {
  id?: string;
  name: string;
  image?: File;
  image_url?: string;
}

interface PollEditorProps {
  poll: PollWithOptions;
  onClose: () => void;
  onSuccess: () => void;
}

export function PollEditor({ poll, onClose, onSuccess }: PollEditorProps) {
  const [title, setTitle] = useState(poll.title);
  const [description, setDescription] = useState(poll.description || "");
  const [multipleChoice, setMultipleChoice] = useState(poll.multiple_choice);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar opções com dados da enquete
    const initialOptions = poll.options.map(option => ({
      id: option.id,
      name: option.name,
      image_url: option.image_url,
    }));
    setOptions(initialOptions);
  }, [poll]);

  const addOption = () => {
    setOptions([...options, { name: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof PollOption, value: any) => {
    const updatedOptions = [...options];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    setOptions(updatedOptions);
  };

  const handleImageUpload = (index: number, file: File) => {
    updateOption(index, 'image', file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    updateOption(index, 'image_url', previewUrl);
  };

  const nextImage = (optionIndex: number) => {
    const currentIndex = currentImageIndex[optionIndex] || 0;
    setCurrentImageIndex({
      ...currentImageIndex,
      [optionIndex]: currentIndex + 1
    });
  };

  const prevImage = (optionIndex: number) => {
    const currentIndex = currentImageIndex[optionIndex] || 0;
    setCurrentImageIndex({
      ...currentImageIndex,
      [optionIndex]: Math.max(0, currentIndex - 1)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validOptions = options.filter(opt => opt.name.trim() !== "");
    
    if (validOptions.length < 2) {
      toast({
        title: "Erro",
        description: "A enquete deve ter pelo menos 2 opções válidas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Upload das novas imagens primeiro
      const processedOptions = await Promise.all(
        validOptions.map(async (option) => {
          if (option.image) {
            const imageUrl = await uploadPollImage(option.image);
            return { 
              id: option.id,
              name: option.name, 
              image_url: imageUrl 
            };
          }
          return { 
            id: option.id,
            name: option.name, 
            image_url: option.image_url 
          };
        })
      );

      await updatePoll(poll.id, {
        title,
        description,
        multiple_choice: multipleChoice,
        options: processedOptions,
      });

      toast({
        title: "Enquete atualizada",
        description: "A enquete foi atualizada com sucesso",
      });

      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Error updating poll:", error);
      toast({
        title: "Erro ao atualizar enquete",
        description: "Não foi possível atualizar a enquete",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pollTitle" className="block text-sm font-medium mb-1">
            Título
          </label>
          <Input
            id="pollTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="pollDescription" className="block text-sm font-medium mb-1">
            Descrição
          </label>
          <Textarea
            id="pollDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="multipleChoice"
            checked={multipleChoice}
            onCheckedChange={setMultipleChoice}
          />
          <label htmlFor="multipleChoice" className="text-sm font-medium">
            Permitir múltipla escolha
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Opções da Enquete
          </label>
          
          {options.map((option, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Opção {index + 1}</span>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Input
                type="text"
                placeholder="Nome da opção"
                value={option.name}
                onChange={(e) => updateOption(index, 'name', e.target.value)}
                className="mb-2"
                required
              />
              
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm">Imagem (opcional):</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(index, file);
                    }
                  }}
                  className="max-w-xs"
                />
              </div>
              
              {option.image_url && (
                <div className="relative w-full max-w-xs">
                  <img
                    src={option.image_url}
                    alt={`Preview ${index + 1}`}
                    className="w-[131px] h-[131px] object-cover rounded"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => prevImage(index)}
                      className="ml-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => nextImage(index)}
                      className="mr-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addOption}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Opção
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="submit" 
            className="volleyball-button-primary flex-1" 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar Enquete"
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
