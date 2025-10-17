import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  DollarSign, 
  Calendar, 
  Building, 
  User, 
  Mail, 
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Plus
} from 'lucide-react';

interface InvoiceFormData {
  // Basic Invoice Information
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorName: string;
  vendorAddress: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorTaxId: string;
  
  // Payment Information
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  paymentTerms: string;
  
  // Business Information
  department: string;
  costCenter: string;
  projectCode: string;
  budgetCategory: string;
  businessPurpose: string;
  
  // Approval Information
  requestorName: string;
  requestorEmail: string;
  requestorPhone: string;
  managerApproval: boolean;
  financeApproval: boolean;
  legalApproval: boolean;
  complianceApproval: boolean;
  
  // Additional Information
  description: string;
  justification: string;
  supportingDocuments: File[];
  internalNotes: string;
  externalNotes: string;
  
  // Compliance & Legal
  taxExempt: boolean;
  taxExemptReason: string;
  contractRequired: boolean;
  contractNumber: string;
  purchaseOrderNumber: string;
  receiptRequired: boolean;
  
  // Payment Details
  bankAccount: string;
  routingNumber: string;
  paymentInstructions: string;
  urgency: string;
  expectedPaymentDate: string;
}

interface InvoiceUploadFormProps {
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InvoiceFormData>({
    // Basic Invoice Information
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    vendorName: '',
    vendorAddress: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorTaxId: '',
    
    // Payment Information
    totalAmount: 0,
    taxAmount: 0,
    discountAmount: 0,
    netAmount: 0,
    currency: 'INR',
    paymentMethod: '',
    paymentTerms: '',
    
    // Business Information
    department: '',
    costCenter: '',
    projectCode: '',
    budgetCategory: '',
    businessPurpose: '',
    
    // Approval Information
    requestorName: '',
    requestorEmail: '',
    requestorPhone: '',
    managerApproval: false,
    financeApproval: false,
    legalApproval: false,
    complianceApproval: false,
    
    // Additional Information
    description: '',
    justification: '',
    supportingDocuments: [],
    internalNotes: '',
    externalNotes: '',
    
    // Compliance & Legal
    taxExempt: false,
    taxExemptReason: '',
    contractRequired: false,
    contractNumber: '',
    purchaseOrderNumber: '',
    receiptRequired: false,
    
    // Payment Details
    bankAccount: '',
    routingNumber: '',
    paymentInstructions: '',
    urgency: 'Normal',
    expectedPaymentDate: '',
  });

  const [currentSection, setCurrentSection] = useState('basic');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const sections = [
    { id: 'basic', title: 'Basic Information', icon: FileText },
    { id: 'vendor', title: 'Vendor Details', icon: Building },
    { id: 'payment', title: 'Payment Information', icon: DollarSign },
    { id: 'business', title: 'Business Details', icon: Receipt },
    { id: 'approval', title: 'Approval Requirements', icon: CheckCircle },
    { id: 'compliance', title: 'Compliance & Legal', icon: AlertCircle },
    { id: 'documents', title: 'Documents & Notes', icon: Upload },
  ];

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-calculate net amount
    if (field === 'totalAmount' || field === 'taxAmount' || field === 'discountAmount') {
      const total = field === 'totalAmount' ? value : formData.totalAmount;
      const tax = field === 'taxAmount' ? value : formData.taxAmount;
      const discount = field === 'discountAmount' ? value : formData.discountAmount;
      setFormData(prev => ({
        ...prev,
        netAmount: total + tax - discount
      }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    setFormData(prev => ({
      ...prev,
      supportingDocuments: [...prev.supportingDocuments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.invoiceNumber || !formData.vendorName || !formData.totalAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Invoice Number, Vendor Name, Total Amount)",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData);
  };

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoiceNumber">Invoice Number *</Label>
          <Input
            id="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
            placeholder="INV-2024-001"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="invoiceDate">Invoice Date *</Label>
          <Input
            id="invoiceDate"
            type="date"
            value={formData.invoiceDate}
            onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="urgency">Urgency Level</Label>
          <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the goods or services provided..."
          required
        />
      </div>
    </div>
  );

  const renderVendorDetails = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="vendorName">Vendor Name *</Label>
        <Input
          id="vendorName"
          value={formData.vendorName}
          onChange={(e) => handleInputChange('vendorName', e.target.value)}
          placeholder="ABC Company Ltd."
          required
        />
      </div>

      <div>
        <Label htmlFor="vendorAddress">Vendor Address</Label>
        <Textarea
          id="vendorAddress"
          value={formData.vendorAddress}
          onChange={(e) => handleInputChange('vendorAddress', e.target.value)}
          placeholder="123 Business St, City, State, ZIP"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="vendorEmail">Vendor Email</Label>
          <Input
            id="vendorEmail"
            type="email"
            value={formData.vendorEmail}
            onChange={(e) => handleInputChange('vendorEmail', e.target.value)}
            placeholder="vendor@company.com"
          />
        </div>
        
        <div>
          <Label htmlFor="vendorPhone">Vendor Phone</Label>
          <Input
            id="vendorPhone"
            type="tel"
            value={formData.vendorPhone}
            onChange={(e) => handleInputChange('vendorPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        
        <div>
          <Label htmlFor="vendorTaxId">Vendor Tax ID</Label>
          <Input
            id="vendorTaxId"
            value={formData.vendorTaxId}
            onChange={(e) => handleInputChange('vendorTaxId', e.target.value)}
            placeholder="12-3456789"
          />
        </div>
      </div>
    </div>
  );

  const renderPaymentInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalAmount">Total Amount *</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            value={formData.totalAmount}
            onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="taxAmount">Tax Amount</Label>
          <Input
            id="taxAmount"
            type="number"
            step="0.01"
            value={formData.taxAmount}
            onChange={(e) => handleInputChange('taxAmount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
        
        <div>
          <Label htmlFor="discountAmount">Discount Amount</Label>
          <Input
            id="discountAmount"
            type="number"
            step="0.01"
            value={formData.discountAmount}
            onChange={(e) => handleInputChange('discountAmount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <Label className="text-green-800 font-semibold">Net Amount</Label>
        </div>
        <div className="text-2xl font-bold text-green-900">
          {formData.currency} {formData.netAmount.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACH">ACH Transfer</SelectItem>
              <SelectItem value="Wire">Wire Transfer</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
              <SelectItem value="CreditCard">Credit Card</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="paymentTerms">Payment Terms</Label>
          <Select value={formData.paymentTerms} onValueChange={(value) => handleInputChange('paymentTerms', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Net15">Net 15</SelectItem>
              <SelectItem value="Net30">Net 30</SelectItem>
              <SelectItem value="Net45">Net 45</SelectItem>
              <SelectItem value="Net60">Net 60</SelectItem>
              <SelectItem value="COD">Cash on Delivery</SelectItem>
              <SelectItem value="Prepaid">Prepaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderBusinessDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="HR">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="IT">Information Technology</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="costCenter">Cost Center</Label>
          <Input
            id="costCenter"
            value={formData.costCenter}
            onChange={(e) => handleInputChange('costCenter', e.target.value)}
            placeholder="CC-001"
          />
        </div>
        
        <div>
          <Label htmlFor="projectCode">Project Code</Label>
          <Input
            id="projectCode"
            value={formData.projectCode}
            onChange={(e) => handleInputChange('projectCode', e.target.value)}
            placeholder="PRJ-2024-001"
          />
        </div>
        
        <div>
          <Label htmlFor="budgetCategory">Budget Category</Label>
          <Select value={formData.budgetCategory} onValueChange={(value) => handleInputChange('budgetCategory', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select budget category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Services">Services</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Training">Training</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Office Supplies">Office Supplies</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="businessPurpose">Business Purpose *</Label>
        <Textarea
          id="businessPurpose"
          value={formData.businessPurpose}
          onChange={(e) => handleInputChange('businessPurpose', e.target.value)}
          placeholder="Explain the business need and purpose for this expense..."
          required
        />
      </div>
    </div>
  );

  const renderApprovalRequirements = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="requestorName">Requestor Name *</Label>
          <Input
            id="requestorName"
            value={formData.requestorName}
            onChange={(e) => handleInputChange('requestorName', e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="requestorEmail">Requestor Email *</Label>
          <Input
            id="requestorEmail"
            type="email"
            value={formData.requestorEmail}
            onChange={(e) => handleInputChange('requestorEmail', e.target.value)}
            placeholder="john.doe@company.com"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="requestorPhone">Requestor Phone</Label>
          <Input
            id="requestorPhone"
            type="tel"
            value={formData.requestorPhone}
            onChange={(e) => handleInputChange('requestorPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Required Approvals</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="managerApproval"
              checked={formData.managerApproval}
              onCheckedChange={(checked) => handleInputChange('managerApproval', checked)}
            />
            <Label htmlFor="managerApproval">Manager Approval Required</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="financeApproval"
              checked={formData.financeApproval}
              onCheckedChange={(checked) => handleInputChange('financeApproval', checked)}
            />
            <Label htmlFor="financeApproval">Finance Approval Required</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="legalApproval"
              checked={formData.legalApproval}
              onCheckedChange={(checked) => handleInputChange('legalApproval', checked)}
            />
            <Label htmlFor="legalApproval">Legal Approval Required</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="complianceApproval"
              checked={formData.complianceApproval}
              onCheckedChange={(checked) => handleInputChange('complianceApproval', checked)}
            />
            <Label htmlFor="complianceApproval">Compliance Approval Required</Label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComplianceLegal = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="taxExempt"
            checked={formData.taxExempt}
            onCheckedChange={(checked) => handleInputChange('taxExempt', checked)}
          />
          <Label htmlFor="taxExempt">Tax Exempt</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="contractRequired"
            checked={formData.contractRequired}
            onCheckedChange={(checked) => handleInputChange('contractRequired', checked)}
          />
          <Label htmlFor="contractRequired">Contract Required</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="receiptRequired"
            checked={formData.receiptRequired}
            onCheckedChange={(checked) => handleInputChange('receiptRequired', checked)}
          />
          <Label htmlFor="receiptRequired">Receipt Required</Label>
        </div>
      </div>

      {formData.taxExempt && (
        <div>
          <Label htmlFor="taxExemptReason">Tax Exempt Reason</Label>
          <Input
            id="taxExemptReason"
            value={formData.taxExemptReason}
            onChange={(e) => handleInputChange('taxExemptReason', e.target.value)}
            placeholder="Reason for tax exemption..."
          />
        </div>
      )}

      {formData.contractRequired && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contractNumber">Contract Number</Label>
            <Input
              id="contractNumber"
              value={formData.contractNumber}
              onChange={(e) => handleInputChange('contractNumber', e.target.value)}
              placeholder="CONTRACT-2024-001"
            />
          </div>
          
          <div>
            <Label htmlFor="purchaseOrderNumber">Purchase Order Number</Label>
            <Input
              id="purchaseOrderNumber"
              value={formData.purchaseOrderNumber}
              onChange={(e) => handleInputChange('purchaseOrderNumber', e.target.value)}
              placeholder="PO-2024-001"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderDocumentsNotes = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="justification">Justification *</Label>
        <Textarea
          id="justification"
          value={formData.justification}
          onChange={(e) => handleInputChange('justification', e.target.value)}
          placeholder="Provide detailed justification for this expense..."
          required
        />
      </div>

      <div>
        <Label htmlFor="internalNotes">Internal Notes</Label>
        <Textarea
          id="internalNotes"
          value={formData.internalNotes}
          onChange={(e) => handleInputChange('internalNotes', e.target.value)}
          placeholder="Internal notes for the finance team..."
        />
      </div>

      <div>
        <Label htmlFor="externalNotes">External Notes</Label>
        <Textarea
          id="externalNotes"
          value={formData.externalNotes}
          onChange={(e) => handleInputChange('externalNotes', e.target.value)}
          placeholder="Notes to be shared with vendor..."
        />
      </div>

      <div>
        <Label htmlFor="fileUpload">Supporting Documents</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-2">Upload invoice, receipts, contracts, or other supporting documents</p>
          <input
            id="fileUpload"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('fileUpload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{file.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'basic':
        return renderBasicInformation();
      case 'vendor':
        return renderVendorDetails();
      case 'payment':
        return renderPaymentInformation();
      case 'business':
        return renderBusinessDetails();
      case 'approval':
        return renderApprovalRequirements();
      case 'compliance':
        return renderComplianceLegal();
      case 'documents':
        return renderDocumentsNotes();
      default:
        return renderBasicInformation();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Invoice Upload & Approval Form
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant={currentSection === section.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSection(section.id)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </Button>
            );
          })}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {renderCurrentSection()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              {sections.map((section, index) => {
                const currentIndex = sections.findIndex(s => s.id === currentSection);
                if (index < currentIndex) {
                  return (
                    <Button
                      key={section.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentSection(section.id)}
                    >
                      {section.title}
                    </Button>
                  );
                }
                return null;
              })}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              
              {currentSection !== sections[sections.length - 1].id ? (
                <Button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === currentSection);
                    if (currentIndex < sections.length - 1) {
                      setCurrentSection(sections[currentIndex + 1].id);
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Invoice"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceUploadForm;
