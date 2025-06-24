
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { createPoll, uploadPollImage } from "@/lib/polls";
import { Loader2, Plus, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";

interface PollOption {
  name: string;
  image?: File;
  image_url?: string;
}

export function PollCreator() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([{ name: "" }, { name: "" }]);
  const [isCreating, setIsCreating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

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
    
    if (!user) return;
    
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
      setIsCreating(true);
      
      // Upload das imagens primeiro
      const processedOptions = await Promise.all(
        validOptions.map(async (option) => {
          if (option.image) {
            const imageUrl = await uploadPollImage(option.image);
            return { name: option.name, image_url: imageUrl };
          }
          return { name: option.name };
        })
      );

      await createPoll({
        title,
        description,
        multiple_choice: multipleChoice,
        created_by: user.id,
        options: processedOptions,
      });

      toast({
        title: "Enquete criada",
        description: "A enquete foi criada com sucesso",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setMultipleChoice(false);
      setOptions([{ name: "" }, { name: "" }]);
      setCurrentImageIndex({});
      
    } catch (error) {
      console.error("Error creating poll:", error);
      toast({
        title: "Erro ao criar enquete",
        description: "Não foi possível criar a enquete",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Criar Nova Enquete</h2>
      
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
                    className="w-full h-32 object-cover rounded"
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
        
        <Button 
          type="submit" 
          className="volleyball-button-primary w-full mt-4" 
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando Enquete...
            </>
          ) : (
            "Criar Enquete"
          )}
        </Button>
      </form>
    </div>
  );
}
