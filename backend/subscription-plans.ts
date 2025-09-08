import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from './db';
import { subscriptionPlans, InsertSubscriptionPlan } from './shared/schema.dialect';
import { eq } from 'drizzle-orm';

// Get all active subscription plans
export const getSubscriptionPlans = async (_req: Request, res: Response) => {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.monthlyPrice);

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
};

// Get subscription plan by ID
export const getSubscriptionPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    if (plan.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json(plan[0]);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plan' });
  }
};

// Create subscription plan (admin only)
export const createSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const planData: InsertSubscriptionPlan = req.body;
    
    const newPlan = await db
      .insert(subscriptionPlans)
      .values({ id: randomUUID(), ...planData })
      .returning();

    res.status(201).json(newPlan[0]);
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
};

// Update subscription plan (admin only)
export const updateSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPlan = await db
      .update(subscriptionPlans)
      .set(updateData)
      .where(eq(subscriptionPlans.id, id))
      .returning();

    if (updatedPlan.length === 0) {
      return res.status(404).json({ error: 'Subscription plan not found' });
    }

    res.json(updatedPlan[0]);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
};

// Seed default subscription plans
export const seedSubscriptionPlans = async () => {
  try {
    const existingPlans = await db.select().from(subscriptionPlans).limit(1);
    
    if (existingPlans.length > 0) {
      console.log('Subscription plans already exist, skipping seed');
      return;
    }

    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        name: 'Starter',
        nameRw: 'Intangiriro',
        description: 'Perfect for small businesses getting started with online sales',
        descriptionRw: 'Byiza kubucuruzi buto butangira gucuruza kumurongo',
        monthlyPrice: '15000',
        annualPrice: '150000',
        features: [
          'Up to 50 products',
          'Basic analytics',
          'Email support',
          'Mobile payment integration',
          'Basic store customization'
        ],
        featuresRw: [
          'Ibicuruzwa bigera kuri 50',
          'Isesengura ry\'ibanze',
          'Ubufasha bwa imeyili',
          'Kwishyura na telefoni',
          'Guhindura iduka ry\'ibanze'
        ],
        maxProducts: 50,
        maxOrders: 200,
        hasAnalytics: true,
        hasPrioritySupport: false,
        hasCustomBranding: false
      },
      {
        name: 'Professional',
        nameRw: 'Umwuga',
        description: 'Ideal for growing businesses with advanced features',
        descriptionRw: 'Byiza kubucuruzi bukura bufite ibikoresho byihuse',
        monthlyPrice: '35000',
        annualPrice: '350000',
        features: [
          'Up to 200 products',
          'Advanced analytics & insights',
          'Priority email & chat support',
          'Multiple payment methods',
          'Custom branding',
          'Inventory management',
          'Customer reviews system'
        ],
        featuresRw: [
          'Ibicuruzwa bigera kuri 200',
          'Isesengura ryihuse n\'ubushishozi',
          'Ubufasha bw\'ibanze bwa imeyili na chat',
          'Uburyo bwinshi bwo kwishyura',
          'Ikimenyetso cyawe',
          'Gucunga ibicuruzwa',
          'Sisitemu y\'ibitekerezo by\'abakiriya'
        ],
        maxProducts: 200,
        maxOrders: 1000,
        hasAnalytics: true,
        hasPrioritySupport: true,
        hasCustomBranding: true
      },
      {
        name: 'Enterprise',
        nameRw: 'Ikigo',
        description: 'Complete solution for large businesses with unlimited features',
        descriptionRw: 'Igisubizo cyuzuye kubucuruzi bunini bufite ibikoresho bitagira imipaka',
        monthlyPrice: '75000',
        annualPrice: '750000',
        features: [
          'Unlimited products',
          'Advanced AI analytics',
          '24/7 priority support',
          'All payment methods',
          'Full custom branding',
          'Advanced inventory management',
          'Multi-location support',
          'API access',
          'Custom integrations'
        ],
        featuresRw: [
          'Ibicuruzwa bitagira imipaka',
          'Isesengura ryihuse rya AI',
          'Ubufasha bwa 24/7',
          'Uburyo bwose bwo kwishyura',
          'Ikimenyetso cyuzuye cyawe',
          'Gucunga ibicuruzwa byihuse',
          'Gushyigikira ahantu henshi',
          'Kubona API',
          'Kwishyira hamwe byihariye'
        ],
        maxProducts: 0, // unlimited
        maxOrders: 0, // unlimited
        hasAnalytics: true,
        hasPrioritySupport: true,
        hasCustomBranding: true
      }
    ];

    const plansWithIds = defaultPlans.map((p) => ({ id: randomUUID(), ...p }));
    await db.insert(subscriptionPlans).values(plansWithIds);
    console.log('Default subscription plans seeded successfully');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  }
};
