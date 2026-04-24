import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Building2, Phone, User, MapPin, Pencil, Trash2, Save, Truck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  note: string | null;
}

interface SuppliersPageProps {
  suppliers: Supplier[];
  onCreateSupplier: (data: { name: string; phone: string; contact_person: string; address: string; note: string }) => void;
  onUpdateSupplier: (id: number, data: { name?: string; phone?: string | null; contact_person?: string | null; address?: string | null; note?: string | null }) => void;
  onDeleteSupplier: (id: number) => void;
  searchQuery?: string;
}

export function SuppliersPage({
  suppliers,
  onCreateSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  searchQuery,
}: SuppliersPageProps) {
  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.contact_person || "").toLowerCase().includes(q) ||
      (s.phone || "").toLowerCase().includes(q) || (s.address || "").toLowerCase().includes(q);
  });
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNote, setNewNote] = useState("");

  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNote, setEditNote] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);

  function openEdit(s: Supplier) {
    setEditSupplier(s);
    setEditName(s.name);
    setEditPhone(s.phone || "");
    setEditContact(s.contact_person || "");
    setEditAddress(s.address || "");
    setEditNote(s.note || "");
  }

  function saveEdit() {
    if (!editSupplier) return;
    onUpdateSupplier(editSupplier.id, {
      name: editName || undefined,
      phone: editPhone || null,
      contact_person: editContact || null,
      address: editAddress || null,
      note: editNote || null,
    });
    setEditSupplier(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">供應商管理</h2>
          <p className="text-sm text-muted-foreground">管理供應商資訊與聯繫方式</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              供應商列表
            </CardTitle>
            <CardDescription>共 {filteredSuppliers.length} 个供应商{filteredSuppliers.length !== suppliers.length ? `（筛选自 ${suppliers.length} 个）` : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSuppliers.length === 0 ? (
              <EmptyState icon={Truck} title="暂无供应商" description="添加供应商开始管理" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名稱</TableHead>
                    <TableHead>聯繫人</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        {s.contact_person ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{s.contact_person}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-mono text-xs">{s.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.address ? (
                          <div className="flex items-center gap-1.5 max-w-[200px]">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate text-xs">{s.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(s)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>新增供應商</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>供應商名稱</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="如：東海鮮物貿易" />
            </div>
            <div className="space-y-2">
              <Label>聯繫人</Label>
              <Input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="如：張先生" />
            </div>
            <div className="space-y-2">
              <Label>電話</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="如：02-12345678" />
            </div>
            <div className="space-y-2">
              <Label>地址</Label>
              <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="如：台北市中山區" />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="備註資訊" />
            </div>
            <Separator />
            <Button className="w-full" onClick={() => {
              if (newName.trim()) {
                onCreateSupplier({ name: newName.trim(), phone: newPhone.trim(), contact_person: newContact.trim(), address: newAddress.trim(), note: newNote.trim() });
                setNewName(""); setNewPhone(""); setNewContact(""); setNewAddress(""); setNewNote("");
              }
            }} disabled={!newName.trim()}>
              <Plus className="mr-2 h-4 w-4" />新增
            </Button>

            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">快速添加</h4>
              <div className="flex flex-wrap gap-2">
                {["海鲜供应商", "肉类供应商", "蔬菜供应商", "调味料供应商"].map((name) => (
                  <Button key={name} variant="outline" size="sm" onClick={() => setNewName(name)}>{name}</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editSupplier} onOpenChange={() => setEditSupplier(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>編輯供應商</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名稱</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>聯繫人</Label>
              <Input value={editContact} onChange={(e) => setEditContact(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>電話</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>地址</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>備註</Label>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSupplier(null)}>取消</Button>
            <Button onClick={saveEdit}><Save className="mr-1 h-4 w-4" />保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>確認刪除</DialogTitle></DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">確定要刪除供應商「{deleteConfirm?.name}」嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
            <Button variant="destructive" onClick={() => { if (deleteConfirm) { onDeleteSupplier(deleteConfirm.id); } setDeleteConfirm(null); }}>刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
