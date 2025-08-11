"use client"

import { Badge } from "@/components/ui/badge"

import { Brain, DollarSign, ShieldCheck, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

export function SettingsSection() {
  const [activeSettingsSection, setActiveSettingsSection] = useState("general")
  const [industry, setIndustry] = useState("retail")

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure ANDI to match your business needs</p>
      </div>

      <div className="flex space-x-2 mb-6">
        <Button
          variant="ghost"
          className={`${activeSettingsSection === "general" ? "border border-zamora-purple text-zamora-purple bg-transparent" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveSettingsSection("general")}
        >
          General
        </Button>
        <Button
          variant="ghost"
          className={`${activeSettingsSection === "users" ? "border border-zamora-purple text-zamora-purple bg-transparent" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveSettingsSection("users")}
        >
          User Access
        </Button>
        <Button
          variant="ghost"
          className={`${activeSettingsSection === "integrations" ? "border border-zamora-purple text-zamora-purple bg-transparent" : "text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveSettingsSection("integrations")}
        >
          Integrations
        </Button>
      </div>

      {activeSettingsSection === "general" && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Brain className="text-zamora-purple mr-2 h-4 w-4" />
                    <Label className="text-sm">AI Model Selection</Label>
                  </div>
                  <Select defaultValue="advanced">
                    <SelectTrigger className="w-[180px] bg-secondary border-border">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="text-zamora-purple mr-2 h-4 w-4" />
                    <Label className="text-sm">Automated Actions</Label>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ShieldCheck className="text-zamora-purple mr-2 h-4 w-4" />
                    <Label className="text-sm">Enhanced Security</Label>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="text-zamora-purple mr-2 h-4 w-4" />
                    <Label className="text-sm">Cost Optimization</Label>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <Button className="bg-zamora-purple hover:bg-zamora-purple-dark">Save Settings</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Industry Selection</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail & E-commerce</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="saas">SaaS & Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Data Retention Period</Label>
                  <Select defaultValue="12months">
                    <SelectTrigger className="w-full bg-secondary border-border">
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="12months">12 Months</SelectItem>
                      <SelectItem value="24months">24 Months</SelectItem>
                      <SelectItem value="forever">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeSettingsSection === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>User Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Manage user access and permissions</p>
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">John Doe</div>
                  <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Super Admin</Badge>
                </div>
                <div className="text-xs text-muted-foreground">john.doe@example.com</div>
                <div className="text-xs text-muted-foreground mt-1">Last active: 5 minutes ago</div>
              </div>

              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Jane Smith</div>
                  <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Admin</Badge>
                </div>
                <div className="text-xs text-muted-foreground">jane.smith@example.com</div>
                <div className="text-xs text-muted-foreground mt-1">Last active: 2 hours ago</div>
              </div>

              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Robert Johnson</div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Analyst</Badge>
                </div>
                <div className="text-xs text-muted-foreground">robert.johnson@example.com</div>
                <div className="text-xs text-muted-foreground mt-1">Last active: 1 day ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSettingsSection === "integrations" && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Manage your connected services and integrations</p>
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">CRM System</div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Connected 2 months ago</div>
              </div>

              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Marketing Platform</div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Connected 1 month ago</div>
              </div>

              <div className="p-4 bg-secondary rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Financial System</div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Active</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Connected 3 months ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

