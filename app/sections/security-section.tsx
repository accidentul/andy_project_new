"use client"

import { AlertCircle, CheckCircle, Lock, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

interface SecuritySectionProps {
  highlightItem?: string | null
  subsidiary?: {
    id: string
    name: string
    region: string
    employees: number
    revenue: string
    color: string
  }
}

interface VulnerabilityDetail {
  id: string
  title: string
  description: string
  risk: string
  impact: string
  remediation: string
  affectedSystems: string[]
  detectedDate: string
  estimatedEffort: string
  priority: "High" | "Medium" | "Low"
}

// Add this function to get subsidiary-specific security data
const getSubsidiarySecurityData = (subsidiary?: SecuritySectionProps["subsidiary"]) => {
  // Default data for global
  let data = {
    securityScore: "95/100",
    securityScoreChange: "+3",
    dataPrivacy: "100%",
    dataPrivacyChange: "0%",
    threatDetection: "Active",
    threatDetectionChange: "0",
    vulnerabilities: 2,
    vulnerabilityDetails: [
      {
        id: "vuln-001",
        title: "API Rate Limiting Misconfiguration",
        description:
          "Public API endpoints have insufficient rate limiting, potentially allowing for brute force attacks.",
        risk: "Medium Risk",
        impact:
          "Could allow attackers to perform brute force attacks against authentication endpoints or cause denial of service by overwhelming API resources.",
        remediation:
          "Implement proper rate limiting on all public API endpoints. Configure API gateway to limit requests to 100 per minute per IP address.",
        affectedSystems: ["API Gateway", "Authentication Service", "Public Endpoints"],
        detectedDate: "2025-03-10",
        estimatedEffort: "2-4 hours",
        priority: "Medium" as const,
      },
      {
        id: "vuln-002",
        title: "Outdated Dependencies",
        description: "3 third-party libraries have known vulnerabilities and require updates.",
        risk: "Low Risk",
        impact: "May expose the system to known vulnerabilities that have been patched in newer versions.",
        remediation:
          "Update the following packages: axios (v0.21.1 to v1.6.2), lodash (v4.17.15 to v4.17.21), and express (v4.17.1 to v4.18.2).",
        affectedSystems: ["Backend Services", "Admin Dashboard"],
        detectedDate: "2025-03-12",
        estimatedEffort: "1-2 hours",
        priority: "Low" as const,
      },
    ],
  }

  // Subsidiary-specific data
  if (subsidiary) {
    switch (subsidiary.id) {
      case "us":
        data = {
          ...data,
          securityScore: "97/100",
          securityScoreChange: "+2",
          dataPrivacy: "100%",
          dataPrivacyChange: "0%",
          threatDetection: "Active",
          threatDetectionChange: "0",
          vulnerabilities: 1,
          vulnerabilityDetails: [
            {
              id: "vuln-us-001",
              title: "Cloud Storage Permissions",
              description: "Some S3 buckets have overly permissive access controls that should be restricted.",
              risk: "Medium Risk",
              impact:
                "Could potentially expose sensitive data to unauthorized users if bucket policies are not properly configured.",
              remediation:
                "Review and update S3 bucket policies to follow the principle of least privilege. Remove public access where not required and implement proper IAM roles.",
              affectedSystems: ["AWS S3 Storage", "Data Lake", "Backup Systems"],
              detectedDate: "2025-03-05",
              estimatedEffort: "3-5 hours",
              priority: "Medium" as const,
            },
          ],
        }
        break
      case "uk":
        data = {
          ...data,
          securityScore: "94/100",
          securityScoreChange: "+4",
          dataPrivacy: "100%",
          dataPrivacyChange: "0%",
          threatDetection: "Active",
          threatDetectionChange: "0",
          vulnerabilities: 2,
          vulnerabilityDetails: [
            {
              id: "vuln-uk-001",
              title: "GDPR Compliance Gap",
              description: "User consent tracking needs updating to comply with latest GDPR requirements.",
              risk: "Medium Risk",
              impact:
                "Non-compliance with GDPR regulations could result in regulatory fines and damage to company reputation.",
              remediation:
                "Update consent management platform to include new categories required by recent GDPR updates. Implement proper audit trail for all consent changes.",
              affectedSystems: ["User Portal", "Marketing Platform", "CRM System"],
              detectedDate: "2025-02-28",
              estimatedEffort: "8-12 hours",
              priority: "Medium" as const,
            },
            {
              id: "vuln-uk-002",
              title: "Legacy Authentication System",
              description: "London office still using legacy authentication system scheduled for upgrade.",
              risk: "Low Risk",
              impact:
                "The legacy system lacks modern security features like MFA and could be more vulnerable to credential-based attacks.",
              remediation:
                "Accelerate planned migration to the new SSO platform. Implement temporary compensating controls like IP restrictions until migration is complete.",
              affectedSystems: ["HR Portal", "Internal Tools", "Legacy Applications"],
              detectedDate: "2025-03-01",
              estimatedEffort: "16-24 hours",
              priority: "Low" as const,
            },
          ],
        }
        break
      case "germany":
        data = {
          ...data,
          securityScore: "98/100",
          securityScoreChange: "+1",
          dataPrivacy: "100%",
          dataPrivacyChange: "0%",
          threatDetection: "Active",
          threatDetectionChange: "0",
          vulnerabilities: 1,
          vulnerabilityDetails: [
            {
              id: "vuln-de-001",
              title: "Data Residency Compliance",
              description:
                "Some customer data may be processed outside of EU borders requiring additional compliance measures.",
              risk: "Low Risk",
              impact:
                "Potential non-compliance with EU data protection regulations regarding cross-border data transfers.",
              remediation:
                "Implement data residency controls to ensure all EU customer data remains within EU borders. Update data processing agreements with all vendors.",
              affectedSystems: ["Cloud Infrastructure", "Data Processing Pipeline", "Analytics Platform"],
              detectedDate: "2025-03-08",
              estimatedEffort: "12-16 hours",
              priority: "Low" as const,
            },
          ],
        }
        break
      case "japan":
        data = {
          ...data,
          securityScore: "93/100",
          securityScoreChange: "+5",
          dataPrivacy: "100%",
          dataPrivacyChange: "0%",
          threatDetection: "Active",
          threatDetectionChange: "0",
          vulnerabilities: 3,
          vulnerabilityDetails: [
            {
              id: "vuln-jp-001",
              title: "Network Segmentation",
              description: "Tokyo office network requires additional segmentation between departments.",
              risk: "Medium Risk",
              impact:
                "Lack of proper network segmentation could allow lateral movement in case of a breach, increasing the potential impact.",
              remediation:
                "Implement VLAN segmentation between departments. Configure firewall rules to restrict unnecessary cross-department traffic.",
              affectedSystems: ["Network Infrastructure", "Office Systems", "Internal Services"],
              detectedDate: "2025-03-02",
              estimatedEffort: "16-24 hours",
              priority: "Medium" as const,
            },
            {
              id: "vuln-jp-002",
              title: "Endpoint Protection",
              description: "25% of endpoints running outdated security software requiring updates.",
              risk: "Medium Risk",
              impact:
                "Outdated endpoint protection may not detect or prevent the latest threats, leaving systems vulnerable to malware and exploits.",
              remediation:
                "Deploy latest endpoint protection updates to all affected systems. Implement automated update mechanism to prevent future lapses.",
              affectedSystems: ["Employee Workstations", "Company Laptops", "Mobile Devices"],
              detectedDate: "2025-03-07",
              estimatedEffort: "8-12 hours",
              priority: "Medium" as const,
            },
            {
              id: "vuln-jp-003",
              title: "Password Policy",
              description: "Current password policy does not meet latest security standards.",
              risk: "Low Risk",
              impact:
                "Weak password policies could make accounts more susceptible to brute force or dictionary attacks.",
              remediation:
                "Update password policy to require minimum 12 characters with complexity requirements. Implement MFA for all user accounts.",
              affectedSystems: ["Identity Provider", "User Directory", "Authentication Systems"],
              detectedDate: "2025-03-09",
              estimatedEffort: "4-6 hours",
              priority: "Low" as const,
            },
          ],
        }
        break
    }
  }

  return data
}

export function SecuritySection({ highlightItem, subsidiary }: SecuritySectionProps) {
  const securityData = getSubsidiarySecurityData(subsidiary)
  const [selectedVulnerability, setSelectedVulnerability] = useState<VulnerabilityDetail | null>(null)
  const [fixedVulnerabilities, setFixedVulnerabilities] = useState<string[]>([])
  const [isFixing, setIsFixing] = useState(false)
  const [fixProgress, setFixProgress] = useState(0)

  // Filter out fixed vulnerabilities
  const activeVulnerabilities = securityData.vulnerabilityDetails.filter(
    (vuln) => !fixedVulnerabilities.includes(vuln.id),
  )

  useEffect(() => {
    if (highlightItem === "security-vulnerabilities") {
      // Scroll to the relevant element and highlight it
      setTimeout(() => {
        const element = document.getElementById("security-vulnerabilities-card")
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center", // Center the element in the viewport
          })

          // Start with no highlight but add transition classes
          element.classList.add("transition-all", "duration-1500")

          // Fade in slowly
          setTimeout(() => {
            element.classList.add("bg-zamora-purple/10", "border-l-4", "border-zamora-purple", "pl-2")

            // Fade out slowly after a delay
            setTimeout(() => {
              element.classList.remove("bg-zamora-purple/10")
              element.classList.add("bg-transparent")

              // After fade out completes, remove the border
              setTimeout(() => {
                element.classList.remove("border-l-4", "border-zamora-purple", "pl-2")
              }, 1500)
            }, 3000)
          }, 500) // Short delay before starting fade in
        }
      }, 300)
    }
  }, [highlightItem])

  const handleViewDetails = (vulnerability: VulnerabilityDetail) => {
    setSelectedVulnerability(vulnerability)
  }

  const handleCloseDetails = () => {
    setSelectedVulnerability(null)
  }

  const handleFixIssue = (vulnerabilityId: string) => {
    setIsFixing(true)
    setFixProgress(0)

    // Simulate fixing process with progress updates
    const interval = setInterval(() => {
      setFixProgress((prev) => {
        const newProgress = prev + 10
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setFixedVulnerabilities((prev) => [...prev, vulnerabilityId])
            setIsFixing(false)
            setSelectedVulnerability(null)
          }, 500)
        }
        return newProgress
      })
    }, 300)
  }

  const handleRemediateAll = () => {
    if (activeVulnerabilities.length === 0) return

    setIsFixing(true)
    setFixProgress(0)

    // Simulate fixing all issues with progress updates
    const interval = setInterval(() => {
      setFixProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setFixedVulnerabilities((prev) => [...prev, ...activeVulnerabilities.map((vuln) => vuln.id)])
            setIsFixing(false)
          }, 500)
        }
        return newProgress
      })
    }, 200)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Security & Privacy</h1>
        <p className="text-muted-foreground">System security status and privacy controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData.securityScore}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-green-500">{securityData.securityScoreChange}</span>
              <span className="ml-1 text-slate-400">vs Last Month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Privacy</CardTitle>
            <Lock className="h-4 w-4 text-zamora-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData.dataPrivacy}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-green-500">{securityData.dataPrivacyChange}</span>
              <span className="ml-1 text-slate-400">Compliance</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Detection</CardTitle>
            <AlertCircle className="h-4 w-4 text-zamora-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityData.threatDetection}</div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs text-green-500">{securityData.threatDetectionChange}</span>
              <span className="ml-1 text-slate-400">No Threats</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="security-vulnerabilities-card" className="mb-6 transition-all duration-300">
        <CardHeader>
          <CardTitle>Security Scan Results</CardTitle>
          <p className="text-sm text-muted-foreground">Completed 3 hours ago</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Vulnerability Summary</h3>
                <Badge
                  className={`${
                    activeVulnerabilities.length === 0
                      ? "bg-green-500/20 text-green-500 border-green-500/30"
                      : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                  }`}
                >
                  {activeVulnerabilities.length === 0
                    ? "All Issues Fixed"
                    : `${activeVulnerabilities.length} ${activeVulnerabilities.length === 1 ? "Issue" : "Issues"} Found`}
                </Badge>
              </div>

              {activeVulnerabilities.length === 0 ? (
                <div className="p-3 bg-green-500/10 rounded-md flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-sm">All security issues have been successfully remediated.</p>
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {activeVulnerabilities.map((vulnerability, index) => (
                    <div key={index} className="p-3 bg-amber-500/10 rounded-md">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium">{vulnerability.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{vulnerability.description}</p>
                          <div className="flex items-center mt-2">
                            <Badge variant="outline" className="text-xs mr-2">
                              {vulnerability.risk}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleViewDetails(vulnerability)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeVulnerabilities.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    className="bg-zamora-purple hover:bg-zamora-purple-dark w-full"
                    onClick={handleRemediateAll}
                    disabled={isFixing}
                  >
                    {isFixing ? (
                      <>
                        <span className="mr-2">Remediating Issues</span>
                        <Progress value={fixProgress} className="h-2 w-20" />
                      </>
                    ) : (
                      "Remediate All Issues"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">Encryption</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Federated Learning</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Data Anonymization</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Access Controls</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Audit Logging</div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>
            </div>

            <div className="pt-2 mt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Overall Security Level</div>
                <div className="text-sm text-green-500">95%</div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  style={{ width: "95%" }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-md">
              <h3 className="text-sm font-medium mb-2">Data Retention Policy</h3>
              <p className="text-xs text-muted-foreground mb-3">
                All customer data is automatically anonymized after 24 months of inactivity
              </p>
              <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">GDPR Compliant</Badge>
            </div>

            <div className="p-4 bg-secondary rounded-md">
              <h3 className="text-sm font-medium mb-2">AI Training Safeguards</h3>
              <p className="text-xs text-muted-foreground mb-3">
                All AI models are trained on anonymized data with privacy-preserving techniques
              </p>
              <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                Federated Learning Enabled
              </Badge>
            </div>

            <div className="p-4 bg-secondary rounded-md">
              <h3 className="text-sm font-medium mb-2">Access Control Matrix</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Role-based access controls limit data visibility based on user permissions
              </p>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Zero Trust Architecture</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerability Details Dialog */}
      <Dialog open={selectedVulnerability !== null} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedVulnerability && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedVulnerability.title}</DialogTitle>
                <div className="flex items-center space-x-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Detected on {new Date(selectedVulnerability.detectedDate).toLocaleDateString()}
                  </DialogDescription>
                  <Badge
                    className={`
                      ${
                        selectedVulnerability.priority === "High"
                          ? "bg-red-500/20 text-red-500 border-red-500/30"
                          : selectedVulnerability.priority === "Medium"
                            ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            : "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      }
                    `}
                  >
                    {selectedVulnerability.priority} Priority
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedVulnerability.description}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Impact</h3>
                  <p className="text-sm text-muted-foreground">{selectedVulnerability.impact}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Remediation Steps</h3>
                  <p className="text-sm text-muted-foreground">{selectedVulnerability.remediation}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Affected Systems</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedVulnerability.affectedSystems.map((system, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Estimated Effort</h3>
                    <p className="text-sm text-muted-foreground">{selectedVulnerability.estimatedEffort}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Risk Level</h3>
                    <p className="text-sm text-muted-foreground">{selectedVulnerability.risk}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDetails} disabled={isFixing}>
                  Close
                </Button>
                <Button
                  className="bg-zamora-purple hover:bg-zamora-purple-dark"
                  onClick={() => handleFixIssue(selectedVulnerability.id)}
                  disabled={isFixing}
                >
                  {isFixing ? (
                    <>
                      <span className="mr-2">Fixing Issue</span>
                      <Progress value={fixProgress} className="h-2 w-20" />
                    </>
                  ) : (
                    "Fix This Issue"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

