
import { useState } from "react";
import { deleteLanguage } from "@/lib/languageStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteScriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  languageId: string;
  languageName: string;
  onDeleted: () => void;
}

const DeleteScriptDialog = ({
  isOpen,
  onClose,
  languageId,
  languageName,
  onDeleted,
}: DeleteScriptDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteLanguage(languageId);
      
      if (success) {
        toast.success(`"${languageName}" deleted successfully`);
        onDeleted();
      } else {
        toast.error("Failed to delete script");
      }
    } catch (error) {
      console.error("Error deleting script:", error);
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{languageName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            conlang script and remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteScriptDialog;
