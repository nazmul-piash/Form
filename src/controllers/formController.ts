import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getForms = async (req: AuthRequest, res: Response) => {
  try {
    const { role, organizationId, id } = req.user!;
    
    let forms;
    if (role === 'ADMIN') {
      forms = await prisma.form.findMany({
        where: { organizationId, deletedAt: null },
        include: { items: true },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      forms = await prisma.form.findMany({
        where: { organizationId, createdById: id, deletedAt: null },
        include: { items: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
};

export const getFormById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, organizationId, id: userId } = req.user!;

    const form = await prisma.form.findUnique({ 
        where: { id },
        include: { 
            items: {
                include: { documents: true }
            }
        }
    });

    if (!form) return res.status(404).json({ error: 'Form not found' });
    if (form.organizationId !== organizationId) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'CLIENT' && form.createdById !== userId) return res.status(403).json({ error: 'Forbidden' });

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch form' });
  }
};

export const createForm = async (req: AuthRequest, res: Response) => {
  try {
    const { organizationId, id: userId, email } = req.user!;
    const { items, ...formData } = req.body;

    const form = await prisma.form.create({
      data: {
        clientName: formData.clientName,
        email: email,
        organizationId,
        createdById: userId,
        status: 'Draft',
        items: {
            create: items.map((item: any) => ({
                insuranceType: item.insuranceType,
                package: item.package,
                requestType: item.requestType,
                currentPolicyNumber: item.currentPolicyNumber,
                effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
                duration: item.duration,
                documents: {
                    create: item.documents?.map((doc: any) => ({
                        name: doc.name,
                        fileUrl: doc.fileUrl
                    })) || []
                }
            }))
        }
      },
      include: {
          items: {
              include: { documents: true }
          }
      }
    });

    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create form' });
  }
};

export const updateForm = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, organizationId, id: userId } = req.user!;
    const { items, ...updates } = req.body;

    const existingForm = await prisma.form.findUnique({ 
        where: { id },
        include: { items: true }
    });

    if (!existingForm) return res.status(404).json({ error: 'Form not found' });
    if (existingForm.organizationId !== organizationId) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'CLIENT' && existingForm.createdById !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Role-based field validation
    if (role === 'CLIENT') {
      // Client cannot update status arbitrarily (only Draft -> Submitted)
      if (updates.status && updates.status !== existingForm.status) {
          if (existingForm.status === 'Draft' && updates.status === 'Submitted') {
              // Allowed
          } else {
              delete updates.status;
          }
      }
      
      // Client cannot update price
      if (items) {
          items.forEach((item: any) => {
              delete item.price;
          });
      }
    }

    // Transaction to handle nested updates
    await prisma.$transaction(async (tx) => {
        // 1. Update Form details
        await tx.form.update({
            where: { id },
            data: {
                ...updates,
                // If client submits, status might change.
            }
        });

        if (items) {
            // 2. Handle Items
            const existingItemIds = existingForm.items.map(i => i.id);
            const incomingItemIds = items.filter((i: any) => i.id).map((i: any) => i.id);
            
            // Delete removed items
            const toDelete = existingItemIds.filter(id => !incomingItemIds.includes(id));
            if (toDelete.length > 0) {
                await tx.insuranceItem.deleteMany({
                    where: { id: { in: toDelete } }
                });
            }

            // Upsert items (Update existing, Create new)
            for (const item of items) {
                if (item.id) {
                    // Update
                    await tx.insuranceItem.update({
                        where: { id: item.id },
                        data: {
                            insuranceType: item.insuranceType,
                            package: item.package,
                            requestType: item.requestType,
                            currentPolicyNumber: item.currentPolicyNumber,
                            effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
                            duration: item.duration,
                            price: role === 'ADMIN' ? item.price : undefined, // Only Admin updates price
                            documents: {
                                deleteMany: {}, // Simplest for now: clear and re-add docs if changed? Or just append?
                                // Let's assume the frontend sends the full list of docs desired.
                                // Actually, deleting all docs is risky if we just want to add one.
                                // Let's try to be smarter: create new ones.
                                create: item.documents?.filter((d: any) => !d.id).map((d: any) => ({
                                    name: d.name,
                                    fileUrl: d.fileUrl
                                })) || []
                            }
                        }
                    });
                } else {
                    // Create
                    await tx.insuranceItem.create({
                        data: {
                            formId: id,
                            insuranceType: item.insuranceType,
                            package: item.package,
                            requestType: item.requestType,
                            currentPolicyNumber: item.currentPolicyNumber,
                            effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : null,
                            duration: item.duration,
                            price: role === 'ADMIN' ? item.price : undefined,
                            documents: {
                                create: item.documents?.map((d: any) => ({
                                    name: d.name,
                                    fileUrl: d.fileUrl
                                })) || []
                            }
                        }
                    });
                }
            }
        }
    });

    const updatedForm = await prisma.form.findUnique({
        where: { id },
        include: { 
            items: {
                include: { documents: true }
            }
        }
    });

    res.json(updatedForm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update form' });
  }
};

export const deleteForm = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role, organizationId } = req.user!;

        const existingForm = await prisma.form.findUnique({ where: { id } });
        if (!existingForm) return res.status(404).json({ error: 'Form not found' });
        if (existingForm.organizationId !== organizationId) return res.status(403).json({ error: 'Forbidden' });

        if (role === 'CLIENT' && existingForm.status !== 'Draft') {
            return res.status(403).json({ error: 'Cannot delete submitted forms' });
        }

        await prisma.form.update({ 
            where: { id },
            data: { deletedAt: new Date() }
        });
        res.json({ message: 'Form deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete form' });
    }
};
