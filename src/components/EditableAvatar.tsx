import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableAvatarProps {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  editable: boolean;
  className?: string;
  onUpdated?: (newUrl: string) => void;
}

const MAX_SIZE = 200 * 1024; // 200KB

export function EditableAvatar({
  userId,
  username,
  avatarUrl,
  editable,
  className,
  onUpdated,
}: EditableAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null | undefined>(avatarUrl);
  const { toast } = useToast();

  const initials = username.slice(0, 2).toUpperCase();

  const handleClick = () => {
    if (!editable || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({
        title: "Imagem muito grande",
        description: "O tamanho máximo é 200KB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: dataUrl })
        .eq("id", userId);

      if (error) throw error;

      setLocalUrl(dataUrl);
      onUpdated?.(dataUrl);
      toast({ title: "Foto atualizada!" });
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar foto",
        description: err.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Avatar
        className={cn(className, editable && "cursor-pointer ring-offset-2 hover:ring-2 hover:ring-volleyball-purple transition")}
        onClick={handleClick}
        title={editable ? "Clique para alterar sua foto" : undefined}
      >
        <AvatarImage src={localUrl || ""} alt={username} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {editable && (
        <span className="absolute -bottom-0.5 -right-0.5 bg-volleyball-purple text-white rounded-full p-0.5 shadow pointer-events-none">
          {uploading ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Pencil className="h-2.5 w-2.5" />}
        </span>
      )}

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
