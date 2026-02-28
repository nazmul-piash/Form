import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, CheckCircle, Clock, Plus, Trash2, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import FileUpload from '../components/FileUpload';

// Insurance Types
const INSURANCE_TYPES = [
  "Private Liability Insurance",
  "Legal Protection Insurance",
  "Household Insurance",
  "Traffic Legal Insurance",
  "Health Supplement Insurance",
  "Business Legal Insurance"
];

const PACKAGES = ["Basic", "Comfort", "Premium"];
const REQUEST_TYPES = ["New Policy", "Upgrade"];

// Schema Definition
const documentSchema = z.object({
  name: z.string(),
  fileUrl: z.string(),
});

const insuranceItemSchema = z.object({
  id: z.string().optional(),
  insuranceType: z.string(),
  package: z.string(),
  requestType: z.string(),
  currentPolicyNumber: z.string().optional(),
  effectiveDate: z.string().optional(), // Date string YYYY-MM-DD
  duration: z.string().optional(),
  price: z.string().optional(),
  documents: z.array(documentSchema).optional(),
});

const formSchema = z.object({
  clientName: z.string().min(1, 'Client Name is required'),
  email: z.string().email('Invalid email'),
  status: z.string(),
  items: z.array(insuranceItemSchema),
});

type FormData = z.infer<typeof formSchema>;

const FormEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'new';
  const isAdmin = user?.role === 'ADMIN';

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: user?.fullName || '',
      email: user?.email || '',
      status: 'Draft',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Watch items to calculate totals
  const watchedItems = watch("items");
  const totalMonthly = watchedItems?.reduce((sum, item) => sum + (item.price ? parseFloat(item.price) : 0), 0) || 0;

  // Fetch form data if editing
  useEffect(() => {
    if (!isNew && id) {
      axios.get(`/api/forms/${id}`)
        .then(res => {
          // Format dates for input type="date"
          const formattedData = {
              ...res.data,
              items: res.data.items.map((item: any) => ({
                  ...item,
                  effectiveDate: item.effectiveDate ? item.effectiveDate.split('T')[0] : ''
              }))
          };
          reset(formattedData);
          setLastSaved(new Date(res.data.updatedAt));
        })
        .catch(err => {
          setError('Failed to load form');
          console.error(err);
        });
    }
  }, [id, isNew, reset]);

  // Auto-save logic
  useEffect(() => {
    if (isNew || !isDirty) return;
    const timer = setTimeout(() => handleSubmit(onSave)(), 5000);
    return () => clearTimeout(timer);
  }, [isDirty, watch()]);

  // Polling
  useEffect(() => {
    if (isNew) return;
    const interval = setInterval(() => {
      if (!isDirty) {
        axios.get(`/api/forms/${id}`)
          .then(res => {
            const newUpdatedAt = new Date(res.data.updatedAt);
            if (lastSaved && newUpdatedAt > lastSaved) {
                // Refresh data
                const formattedData = {
                    ...res.data,
                    items: res.data.items.map((item: any) => ({
                        ...item,
                        effectiveDate: item.effectiveDate ? item.effectiveDate.split('T')[0] : ''
                    }))
                };
                reset(formattedData);
                setLastSaved(newUpdatedAt);
            }
          })
          .catch(console.error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, isNew, isDirty, lastSaved, reset]);

  const onSave = async (data: FormData) => {
    setSaving(true);
    try {
      let res;
      if (isNew) {
        res = await axios.post('/api/forms', data);
        navigate(`/forms/${res.data.id}`, { replace: true });
      } else {
        res = await axios.put(`/api/forms/${id}`, data);
      }
      setLastSaved(new Date());
    } catch (err) {
      console.error('Save failed', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async (data: FormData) => {
      if (!isAdmin && data.status === 'Draft') {
          data.status = 'Submitted';
      }
      await onSave(data);
      navigate('/');
  };

  const handleAddInsurance = (type: string) => {
      append({
          insuranceType: type,
          package: 'Basic',
          requestType: 'New Policy',
          effectiveDate: '',
          duration: '1 year',
          documents: [],
          price: ''
      });
  };

  const handleDownloadPdf = async () => {
      try {
          const res = await axios.get(`/api/forms/${id}/pdf`, { responseType: 'blob' });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'summary.pdf');
          document.body.appendChild(link);
          link.click();
      } catch (err) {
          console.error('PDF download failed', err);
          alert('Failed to download PDF');
      }
  };

  if (error) {
      return (
          <div className="p-8 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">Go back</button>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'New Request' : 'Edit Request'}
            </h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              {saving ? (
                <span className="flex items-center text-indigo-600">
                  <Clock className="h-3 w-3 mr-1 animate-spin" /> Saving...
                </span>
              ) : lastSaved ? (
                <span className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Saved {format(lastSaved, 'HH:mm:ss')}
                </span>
              ) : (
                <span>Unsaved changes</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {!isNew && isAdmin && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
          )}
          <button
            type="button"
            onClick={handleSubmit(onSave)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            {isAdmin ? 'Update Request' : 'Submit Request'}
          </button>
        </div>
      </div>

      <form className="space-y-8">
        {/* Client Details */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-6">Client Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                type="text"
                {...register('clientName')}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            {isAdmin && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        {...register('status')}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                    >
                        <option>Draft</option>
                        <option>Submitted</option>
                        <option>Reviewing</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                </div>
            )}
          </div>
        </div>

        {/* Insurance Selection */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Select Insurance Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INSURANCE_TYPES.map(type => {
                    const isSelected = fields.some(f => f.insuranceType === type);
                    return (
                        <button
                            key={type}
                            type="button"
                            disabled={isSelected}
                            onClick={() => handleAddInsurance(type)}
                            className={`p-4 border rounded-lg text-left transition-all ${
                                isSelected 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-800 cursor-default' 
                                : 'hover:border-indigo-500 hover:shadow-md'
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{type}</span>
                                {isSelected ? <CheckCircle className="h-5 w-5" /> : <Plus className="h-5 w-5 text-gray-400" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Selected Insurance Blocks */}
        <div className="space-y-6">
            {fields.map((field, index) => {
                const requestType = watch(`items.${index}.requestType`);
                return (
                    <div key={field.id} className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">{field.insuranceType}</h3>
                            <div className="flex items-center gap-4">
                                {isAdmin ? (
                                    <div className="flex items-center bg-white px-3 py-1 rounded border border-gray-300">
                                        <span className="text-sm font-medium text-gray-500 mr-2">Price: €</span>
                                        <input
                                            type="number"
                                            {...register(`items.${index}.price`)}
                                            className="w-20 text-right font-bold text-gray-900 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-lg font-bold text-indigo-600">
                                        {watch(`items.${index}.price`) ? `€${watch(`items.${index}.price`)}/mo` : 'Price Pending'}
                                    </div>
                                )}
                                <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Details */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Package</label>
                                    <select
                                        {...register(`items.${index}.package`)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                    >
                                        {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Request Type</label>
                                    <select
                                        {...register(`items.${index}.requestType`)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                                    >
                                        {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {requestType === 'Upgrade' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Current Policy Number</label>
                                        <input
                                            type="text"
                                            {...register(`items.${index}.currentPolicyNumber`)}
                                            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                                        <input
                                            type="date"
                                            {...register(`items.${index}.effectiveDate`)}
                                            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                                        <input
                                            type="text"
                                            {...register(`items.${index}.duration`)}
                                            className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                            placeholder="e.g. 1 year"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Documents */}
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Documents</h4>
                                <Controller
                                    control={control}
                                    name={`items.${index}.documents`}
                                    render={({ field }) => (
                                        <div className="space-y-3">
                                            {field.value?.map((doc, docIndex) => (
                                                <FileUpload
                                                    key={docIndex}
                                                    value={doc}
                                                    onUpload={() => {}} // Already uploaded
                                                    onRemove={() => {
                                                        const newDocs = [...(field.value || [])];
                                                        newDocs.splice(docIndex, 1);
                                                        field.onChange(newDocs);
                                                    }}
                                                />
                                            ))}
                                            <FileUpload
                                                onUpload={(file) => {
                                                    field.onChange([...(field.value || []), file]);
                                                }}
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {fields.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500">No insurance products selected. Please select from the list above.</p>
                </div>
            )}
        </div>

        {/* Total Price Section */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10">
            <div className="max-w-5xl mx-auto flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-500">Total Monthly Premium</p>
                    <p className="text-3xl font-bold text-indigo-600">€{totalMonthly.toFixed(2)}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-500">Total Annual Premium</p>
                    <p className="text-xl font-semibold text-gray-900">€{(totalMonthly * 12).toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleSubmit(onSave)}
                        className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 shadow-sm"
                    >
                        {isAdmin ? 'Update' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>

      </form>
    </div>
  );
};

export default FormEditor;
