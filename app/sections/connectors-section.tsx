"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Plus,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  FileText,
  BarChart,
  ShoppingCart,
  Mail,
  CreditCard,
  Users,
  Cloud,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Connector {
  id: string
  name: string
  type: string
  status: "connected" | "disconnected" | "error"
  lastSync: string
  icon: React.ReactNode
}

export function ConnectorsSection() {
  const [connectors, setConnectors] = useState<Connector[]>([
    {
      id: "crm",
      name: "CRM System",
      type: "Customer Data",
      status: "connected",
      lastSync: "5 min ago",
      icon: <Users className="h-8 w-8 text-blue-500" />,
    },
    {
      id: "erp",
      name: "ERP Database",
      type: "Financial Data",
      status: "connected",
      lastSync: "12 min ago",
      icon: <Database className="h-8 w-8 text-green-500" />,
    },
    {
      id: "marketing",
      name: "Marketing Platform",
      type: "Campaign Data",
      status: "connected",
      lastSync: "3 min ago",
      icon: <BarChart className="h-8 w-8 text-purple-500" />,
    },
    {
      id: "ecommerce",
      name: "E-commerce Store",
      type: "Sales Data",
      status: "connected",
      lastSync: "8 min ago",
      icon: <ShoppingCart className="h-8 w-8 text-amber-500" />,
    },
    {
      id: "support",
      name: "Support Tickets",
      type: "Customer Support",
      status: "connected",
      lastSync: "15 min ago",
      icon: <FileText className="h-8 w-8 text-teal-500" />,
    },
  ])

  const [availableConnectors, setAvailableConnectors] = useState<Connector[]>([
    {
      id: "email",
      name: "Email Marketing",
      type: "Marketing Data",
      status: "disconnected",
      lastSync: "Never",
      icon: <Mail className="h-8 w-8 text-blue-500" />,
    },
    {
      id: "payment",
      name: "Payment Gateway",
      type: "Transaction Data",
      status: "disconnected",
      lastSync: "Never",
      icon: <CreditCard className="h-8 w-8 text-green-500" />,
    },
    {
      id: "cloud",
      name: "Cloud Storage",
      type: "File Storage",
      status: "disconnected",
      lastSync: "Never",
      icon: <Cloud className="h-8 w-8 text-purple-500" />,
    },
    {
      id: "analytics",
      name: "Web Analytics",
      type: "User Behavior",
      status: "disconnected",
      lastSync: "Never",
      icon: <BarChart className="h-8 w-8 text-amber-500" />,
    },
  ])

  const [addConnectorOpen, setAddConnectorOpen] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  const [connectingStatus, setConnectingStatus] = useState<"idle" | "connecting" | "success" | "error">("idle")

  const handleConnectNew = (connector: Connector) => {
    setSelectedConnector(connector)
    setAddConnectorOpen(true)
    setConnectingStatus("idle")
  }

  const handleConnect = () => {
    if (!selectedConnector) return

    setConnectingStatus("connecting")

    // Simulate connection process
    setTimeout(() => {
      setConnectingStatus("success")

      // Update connectors lists
      const newConnector = {
        ...selectedConnector,
        status: "connected" as const,
        lastSync: "Just now",
      }

      setConnectors([...connectors, newConnector])
      setAvailableConnectors(availableConnectors.filter((c) => c.id !== selectedConnector.id))

      // Close dialog after a delay
      setTimeout(() => {
        setAddConnectorOpen(false)
        setSelectedConnector(null)
      }, 1500)
    }, 2000)
  }

  const handleRefreshConnector = (id: string) => {
    // Simulate refreshing a connector
    setConnectors(
      connectors.map((connector) => (connector.id === id ? { ...connector, lastSync: "Just now" } : connector)),
    )
  }

  const handleDisconnect = (id: string) => {
    // Find the connector to disconnect
    const connectorToDisconnect = connectors.find((c) => c.id === id)

    if (connectorToDisconnect) {
      // Remove from connected list
      setConnectors(connectors.filter((c) => c.id !== id))

      // Add to available list
      setAvailableConnectors([
        ...availableConnectors,
        {
          ...connectorToDisconnect,
          status: "disconnected",
          lastSync: "Never",
        },
      ])
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Data Connectors</h1>
          <p className="text-muted-foreground">Manage your data sources and integrations</p>
        </div>
        <Button onClick={() => setAddConnectorOpen(true)} className="bg-zamora-purple hover:bg-zamora-purple-dark">
          <Plus className="mr-2 h-4 w-4" /> Add Connector
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connected Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">These data sources are currently connected to your dashboard.</p>

          {connectors.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <Database className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-1">No Connected Data Sources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your first data source to start populating your dashboard with data.
              </p>
              <Button
                onClick={() => setAddConnectorOpen(true)}
                className="bg-zamora-purple hover:bg-zamora-purple-dark"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Data Source
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectors.map((connector) => (
                <Card key={connector.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">{connector.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-medium">{connector.name}</h3>
                          <Badge
                            className={`${
                              connector.status === "connected"
                                ? "bg-green-500/20 text-green-500 border-green-500/30"
                                : connector.status === "error"
                                  ? "bg-red-500/20 text-red-500 border-red-500/30"
                                  : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            }`}
                          >
                            {connector.status === "connected"
                              ? "Connected"
                              : connector.status === "error"
                                ? "Error"
                                : "Disconnected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{connector.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last sync: {connector.lastSync}</p>

                        <div className="flex justify-end mt-3 space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleRefreshConnector(connector.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDisconnect(connector.id)}
                          >
                            <X className="h-3 w-3 mr-1" /> Disconnect
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Connectors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Connect these data sources to enhance your dashboard with additional data.
          </p>

          {availableConnectors.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <Check className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium mb-1">All Available Connectors Added</h3>
              <p className="text-sm text-muted-foreground">
                You've connected all available data sources. Check back later for new integrations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableConnectors.map((connector) => (
                <Card key={connector.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">{connector.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium">{connector.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{connector.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enhance your dashboard with {connector.type.toLowerCase()} from {connector.name}
                        </p>

                        <div className="flex justify-end mt-3">
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-zamora-purple hover:bg-zamora-purple-dark"
                            onClick={() => handleConnectNew(connector)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Connect
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Connector Dialog */}
      <Dialog open={addConnectorOpen} onOpenChange={setAddConnectorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedConnector ? `Connect to ${selectedConnector.name}` : "Add New Data Connector"}
            </DialogTitle>
            <DialogDescription>
              {selectedConnector
                ? `Connect your ${selectedConnector.name} account to import ${selectedConnector.type.toLowerCase()}.`
                : "Select a data source to connect to your dashboard."}
            </DialogDescription>
          </DialogHeader>

          {!selectedConnector ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              {availableConnectors.map((connector) => (
                <Card
                  key={connector.id}
                  className="cursor-pointer hover:border-zamora-purple/50 transition-colors"
                  onClick={() => handleConnectNew(connector)}
                >
                  <CardContent className="p-4 flex items-center">
                    <div className="mr-3">{connector.icon}</div>
                    <div>
                      <h3 className="text-sm font-medium">{connector.name}</h3>
                      <p className="text-xs text-muted-foreground">{connector.type}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-4">
              {connectingStatus === "idle" && (
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-secondary/50 rounded-lg">
                    <div className="mr-3">{selectedConnector.icon}</div>
                    <div>
                      <h3 className="font-medium">{selectedConnector.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedConnector.type}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                        API Key
                      </label>
                      <input
                        id="api-key"
                        type="text"
                        placeholder="Enter your API key"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="account-id" className="block text-sm font-medium mb-1">
                        Account ID
                      </label>
                      <input
                        id="account-id"
                        type="text"
                        placeholder="Enter your account ID"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-sync"
                        className="h-4 w-4 rounded border-gray-300 text-zamora-purple focus:ring-zamora-purple"
                        defaultChecked
                      />
                      <label htmlFor="auto-sync" className="text-sm">
                        Enable automatic synchronization
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {connectingStatus === "connecting" && (
                <div className="py-8 text-center">
                  <RefreshCw className="h-10 w-10 text-zamora-purple mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium mb-1">Connecting to {selectedConnector.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we establish a connection to your account...
                  </p>
                </div>
              )}

              {connectingStatus === "success" && (
                <div className="py-8 text-center">
                  <Check className="h-10 w-10 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">Connection Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your {selectedConnector.name} account has been successfully connected.
                  </p>
                </div>
              )}

              {connectingStatus === "error" && (
                <div className="py-8 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">Connection Failed</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We couldn't connect to your {selectedConnector.name} account. Please check your credentials and try
                    again.
                  </p>
                  <Button variant="outline" onClick={() => setConnectingStatus("idle")} className="mx-auto">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}

          {connectingStatus === "idle" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddConnectorOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!selectedConnector}
                className="bg-zamora-purple hover:bg-zamora-purple-dark"
              >
                Connect
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

