import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SettingsCard = ({
  cardTitle,
  children,
}: {
  cardTitle: string;
  children: React.ReactNode;
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
};
