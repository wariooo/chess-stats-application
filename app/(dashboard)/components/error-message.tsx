import { Card, CardContent } from '@/components/ui/card';

interface ErrorMessageProps {
  message: string;
  suggestion?: string;
}

export function ErrorMessage({ message, suggestion }: ErrorMessageProps) {
  return (
    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <p className="font-semibold text-red-900 dark:text-red-100">
              {message}
            </p>
            {suggestion && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {suggestion}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
