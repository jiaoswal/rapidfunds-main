import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import InvoiceUploadForm from '@/components/invoice-upload-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowLeft, FileText } from 'lucide-react';

export default function InvoiceUploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      // Transform the form data into the format expected by the API
      const requestData = {
        title: `Invoice: ${invoiceData.vendorName} - ${invoiceData.invoiceNumber}`,
        description: invoiceData.description,
        amount: invoiceData.netAmount,
        category: 'Invoice' as const,
        customCategory: invoiceData.budgetCategory || 'Other',
        justification: invoiceData.justification,
        businessPurpose: invoiceData.businessPurpose,
        
        // Invoice-specific data
        invoiceData: {
          invoiceNumber: invoiceData.invoiceNumber,
          invoiceDate: invoiceData.invoiceDate,
          dueDate: invoiceData.dueDate,
          vendorName: invoiceData.vendorName,
          vendorAddress: invoiceData.vendorAddress,
          vendorEmail: invoiceData.vendorEmail,
          vendorPhone: invoiceData.vendorPhone,
          vendorTaxId: invoiceData.vendorTaxId,
          totalAmount: invoiceData.totalAmount,
          taxAmount: invoiceData.taxAmount,
          discountAmount: invoiceData.discountAmount,
          netAmount: invoiceData.netAmount,
          currency: invoiceData.currency,
          paymentMethod: invoiceData.paymentMethod,
          paymentTerms: invoiceData.paymentTerms,
          department: invoiceData.department,
          costCenter: invoiceData.costCenter,
          projectCode: invoiceData.projectCode,
          budgetCategory: invoiceData.budgetCategory,
          requestorName: invoiceData.requestorName,
          requestorEmail: invoiceData.requestorEmail,
          requestorPhone: invoiceData.requestorPhone,
          urgency: invoiceData.urgency,
          taxExempt: invoiceData.taxExempt,
          taxExemptReason: invoiceData.taxExemptReason,
          contractRequired: invoiceData.contractRequired,
          contractNumber: invoiceData.contractNumber,
          purchaseOrderNumber: invoiceData.purchaseOrderNumber,
          receiptRequired: invoiceData.receiptRequired,
          internalNotes: invoiceData.internalNotes,
          externalNotes: invoiceData.externalNotes,
          supportingDocuments: invoiceData.supportingDocuments,
        },
        
        // Approval requirements
        approvalRequirements: {
          managerApproval: invoiceData.managerApproval,
          financeApproval: invoiceData.financeApproval,
          legalApproval: invoiceData.legalApproval,
          complianceApproval: invoiceData.complianceApproval,
        },
        
        // Checklist items based on requirements
        checklistItems: [
          ...(invoiceData.managerApproval ? [{ item: 'Manager Approval', completed: false }] : []),
          ...(invoiceData.financeApproval ? [{ item: 'Finance Approval', completed: false }] : []),
          ...(invoiceData.legalApproval ? [{ item: 'Legal Approval', completed: false }] : []),
          ...(invoiceData.complianceApproval ? [{ item: 'Compliance Approval', completed: false }] : []),
          ...(invoiceData.contractRequired ? [{ item: 'Contract Review', completed: false }] : []),
          ...(invoiceData.receiptRequired ? [{ item: 'Receipt Verification', completed: false }] : []),
          ...(invoiceData.taxExempt ? [{ item: 'Tax Exemption Verification', completed: false }] : []),
          { item: 'Invoice Validation', completed: false },
          { item: 'Vendor Verification', completed: false },
          { item: 'Budget Approval', completed: false },
        ],
        
        // Additional metadata
        metadata: {
          requestType: 'invoice',
          source: 'invoice-upload-form',
          submittedBy: user?.id,
          submittedAt: new Date().toISOString(),
        }
      };

      const res = await apiRequest('POST', '/api/requests', requestData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/requests'] });
      setIsSubmitted(true);
      toast({
        title: 'Success',
        description: 'Invoice submitted successfully for approval',
      });
    },
    onError: (error: any) => {
      console.error('Error submitting invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit invoice. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmitInvoice = (invoiceData: any) => {
    submitInvoiceMutation.mutate(invoiceData);
  };

  const handleCancel = () => {
    setLocation('/dashboard');
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Invoice Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your invoice has been submitted and is now in the approval process. 
              You will be notified of any updates via email.
            </p>
            
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                The invoice will be reviewed according to your specified approval requirements. 
                Track the progress in the Approvals section.
              </AlertDescription>
            </Alert>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => setLocation('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Button onClick={() => setLocation('/approvals')}>
                View Approvals
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Invoice</h1>
        <p className="text-gray-600">
          Submit an invoice for approval with all required information and supporting documents.
        </p>
      </div>

      <InvoiceUploadForm
        onSubmit={handleSubmitInvoice}
        onCancel={handleCancel}
        isSubmitting={submitInvoiceMutation.isPending}
      />

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Invoice Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Required Information:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Invoice number and date</li>
                <li>• Vendor details and contact information</li>
                <li>• Accurate amount breakdown</li>
                <li>• Business purpose and justification</li>
                <li>• Supporting documents</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Approval Process:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Manager approval (if required)</li>
                <li>• Finance team review</li>
                <li>• Legal review (if applicable)</li>
                <li>• Compliance verification</li>
                <li>• Final approval and payment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

