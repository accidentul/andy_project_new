"use client"

import { useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function DataSourcesSection() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dataSourceType, setDataSourceType] = useState("")

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-muted-foreground">Connected data sources and integration status</p>
        </div>
        <Button className="bg-zamora-purple hover:bg-zamora-purple-dark" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Data Source
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Data Source</DialogTitle>
            <DialogDescription>Connect a new data source to enhance your analytics capabilities.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataSourceType" className="col-span-4">
                Data Source Type
              </Label>
              <Select value={dataSourceType} onValueChange={setDataSourceType}>
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Select data source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">CRM System</SelectItem>
                  <SelectItem value="erp">ERP Database</SelectItem>
                  <SelectItem value="marketing">Marketing Platform</SelectItem>
                  <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                  <SelectItem value="support">Support Tickets</SelectItem>
                  <SelectItem value="custom">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="col-span-4">
                Connection Name
              </Label>
              <Input id="name" placeholder="Enter a name for this connection" className="col-span-4" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="col-span-4">
                API Key / Access Token
              </Label>
              <Input id="apiKey" type="password" placeholder="Enter your API key" className="col-span-4" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endpoint" className="col-span-4">
                Endpoint URL
              </Label>
              <Input id="endpoint" placeholder="https://api.example.com" className="col-span-4" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-zamora-purple hover:bg-zamora-purple-dark"
              onClick={() => {
                // Here you would handle the form submission
                // For now, just close the dialog
                setDialogOpen(false)
              }}
            >
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connected Data Sources</CardTitle>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
              <div>
                <div className="text-sm font-medium">CRM System</div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-green-500">Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Sync: 5 min ago</div>
                <div className="text-xs text-muted-foreground">12.4K records</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
              <div>
                <div className="text-sm font-medium">ERP Database</div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-green-500">Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Sync: 12 min ago</div>
                <div className="text-xs text-muted-foreground">8.7K records</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
              <div>
                <div className="text-sm font-medium">Marketing Platform</div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-green-500">Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Sync: 3 min ago</div>
                <div className="text-xs text-muted-foreground">5.2K records</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
              <div>
                <div className="text-sm font-medium">E-commerce Store</div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-green-500">Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Sync: 8 min ago</div>
                <div className="text-xs text-muted-foreground">24.8K records</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-secondary">
              <div>
                <div className="text-sm font-medium">Support Tickets</div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-green-500">Connected</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Last Sync: 15 min ago</div>
                <div className="text-xs text-muted-foreground">3.6K records</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">Completeness</div>
                <div className="text-sm text-zamora-purple">96%</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-zamora-purple rounded-full" style={{ width: "96%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">Accuracy</div>
                <div className="text-sm text-zamora-teal">98%</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-zamora-teal rounded-full" style={{ width: "98%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">Consistency</div>
                <div className="text-sm text-zamora-blue">92%</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-zamora-blue rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm">Timeliness</div>
                <div className="text-sm text-amber-500">88%</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "88%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

