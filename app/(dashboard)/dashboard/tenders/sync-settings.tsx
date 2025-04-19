import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SyncSettings } from "@/lib/utils";
import { RefreshCw, Loader2 } from "lucide-react";

interface SyncSettingsProps {
  onSave?: (settings: SyncSettings) => void;
  onSync?: (settings: SyncSettings) => void;
  defaultSettings?: SyncSettings;
  isLoading?: boolean;
}

export function SyncSettingsForm({ onSave, onSync, defaultSettings, isLoading = false }: SyncSettingsProps) {
  const [settings, setSettings] = useState<SyncSettings>(defaultSettings || {});

  // Update parent component whenever settings change
  useEffect(() => {
    if (onSave) {
      onSave(settings);
    }
  }, [settings, onSave]);

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
  };

  const handleSync = () => {
    if (onSync) {
      onSync(settings);
    }
  };

  // Helper to convert "all" placeholders back to null
  const parseSelectValue = (value: string): number | null => {
    return value === "all" ? null : (parseInt(value) || null);
  };

  // Helper to convert null to "all" placeholder
  const getSelectValue = (value: number | null | undefined): string => {
    return value?.toString() || "all";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Settings</CardTitle>
        <CardDescription>Configure tender sync parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pageSize">Page Size</Label>
          <Input
            id="pageSize"
            type="number"
            placeholder="Page size (e.g. 100)"
            value={settings.pageSize || ""}
            onChange={(e) => setSettings({ ...settings, pageSize: parseInt(e.target.value) || null })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenderCategory">Tender Category</Label>
          <Select
            value={getSelectValue(settings.tenderCategory)}
            onValueChange={(value) => setSettings({ ...settings, tenderCategory: parseSelectValue(value) })}
          >
            <SelectTrigger id="tenderCategory">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="2">Open (مفتوحة)</SelectItem>
              <SelectItem value="8">Closed (مغلقة)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenderActivityId">Tender Activity</Label>
          <Select
            value={getSelectValue(settings.tenderActivityId)}
            onValueChange={(value) => setSettings({ ...settings, tenderActivityId: parseSelectValue(value) })}
          >
            <SelectTrigger id="tenderActivityId">
              <SelectValue placeholder="Select activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="1">التجارة</SelectItem>
              <SelectItem value="2">المقاولات</SelectItem>
              <SelectItem value="3">التشغيل والصيانة والنظافة للمنشآت</SelectItem>
              <SelectItem value="4">العقارات والأراضي</SelectItem>
              <SelectItem value="5">الصناعة والتعدين والتدوير</SelectItem>
              <SelectItem value="6">الغاز والمياه والطاقة</SelectItem>
              <SelectItem value="7">المناجم والبترول والمحاجر</SelectItem>
              <SelectItem value="8">الإعلام والنشر والتوزيع</SelectItem>
              <SelectItem value="9">الاتصالات وتقنية المعلومات</SelectItem>
              <SelectItem value="10">الزراعة والصيد</SelectItem>
              <SelectItem value="11">الرعاية الصحية والنقاهة</SelectItem>
              <SelectItem value="12">التعليم والتدريب</SelectItem>
              <SelectItem value="13">التوظيف والاستقدام</SelectItem>
              <SelectItem value="14">الأمن والسلامة</SelectItem>
              <SelectItem value="15">النقل والبريد والتخزين</SelectItem>
              <SelectItem value="16">المهن الاستشارية</SelectItem>
              <SelectItem value="17">السياحة والمطاعم والفنادق وتنظيم المعارض</SelectItem>
              <SelectItem value="18">المالية والتمويل والتأمين</SelectItem>
              <SelectItem value="19">الخدمات الأخرى</SelectItem>
              <SelectItem value="931208">أخرى 931208</SelectItem>
              <SelectItem value="931902">أخرى 931902</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenderAreasIdString">Region</Label>
          <Select
            value={getSelectValue(settings.tenderAreasIdString)}
            onValueChange={(value) => setSettings({ ...settings, tenderAreasIdString: parseSelectValue(value) })}
          >
            <SelectTrigger id="tenderAreasIdString">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="1">منطقة الرياض</SelectItem>
              <SelectItem value="2">منطقة مكة المكرمة</SelectItem>
              <SelectItem value="3">منطقة المدينة المنورة</SelectItem>
              <SelectItem value="4">منطقة القصيم</SelectItem>
              <SelectItem value="5">المنطقة الشرقية</SelectItem>
              <SelectItem value="6">منطقة عسير</SelectItem>
              <SelectItem value="7">منطقة تبوك</SelectItem>
              <SelectItem value="8">منطقة حائل</SelectItem>
              <SelectItem value="9">منطقة الحدود الشمالية</SelectItem>
              <SelectItem value="10">منطقة جازان</SelectItem>
              <SelectItem value="11">منطقة نجران</SelectItem>
              <SelectItem value="12">منطقة الباحة</SelectItem>
              <SelectItem value="13">منطقة الجوف</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fields">Fields (comma-separated)</Label>
          <Input
            id="fields"
            placeholder="tenderId,tenderName,tenderNumber,agencyName,tenderIdString"
            value={Array.isArray(settings.fields) ? settings.fields.join(',') : settings.fields || ""}
            onChange={(e) => {
              const fieldsValue = e.target.value;
              const fieldsArray = fieldsValue ? fieldsValue.split(',').map(f => f.trim()) : [];
              setSettings({ ...settings, fields: fieldsArray.length > 0 ? fieldsArray : null });
            }}
          />
          <p className="text-xs text-muted-foreground">Leave empty for default fields</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setSettings({})} disabled={isLoading}>Reset</Button>
        {onSync ? (
          <Button onClick={handleSync} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isLoading ? "Syncing..." : "Sync Now"}
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={isLoading}>Save Settings</Button>
        )}
      </CardFooter>
    </Card>
  );
} 