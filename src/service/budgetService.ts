import { Request, Response } from "express";
import { BudgetRequestInterface } from "../interface/request/budgetRequestInterface";
import {
  addBudget,
  budgetExpenses,
  getAllBudgetsByUserId,
  getBudgetByDate,
  getBudgetById,
  getBudgetByUserId,
  setBudgetActiveRepo,
} from "../repository/Budget";
import { getExpensesSumByBudgetId } from "../repository/Expenses";
import { BudgetExpensesInterface } from "../interface/Budget";

export const addBudgetService = async (req: Request, res: Response) => {
  const budget = req.body as BudgetRequestInterface;

  const userId = req.session.userId;
  const budgetWithUserId = {
    ...budget,
    userId: userId,
  } as BudgetRequestInterface;

  await addBudget(budgetWithUserId);
  return res
    .status(200)
    .send({ message: "Budget is added.", budgetWithUserId });
};

export const getAllBudgetByUserIDService = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res
        .status(401)
        .send({ message: "Unauthorized: No user session found." });
    }

    const userBudgetData = await getAllBudgetsByUserId(String(userId));
    const totalAmount = userBudgetData.reduce(
      (sum, budget) => sum + Number(budget.amount),
      0
    );

    return res.status(200).send({ totalAmount, data: userBudgetData });
  } catch (error: any) {
    return res.status(400).send({ message: error?.message || "Server error" });
  }
};

export const getBudgetByIdService = async (req: Request, res: Response) => {
  const userId = req.session.userId;

  const budgetData = await getBudgetById(String(userId));
  if (!budgetData) {
    return res.status(404).send({ message: "Budget not found." });
  }

  return res.status(200).send({ data: budgetData });
};

export const getBudgetByDateService = async (req: Request, res: Response) => {
  const userId = req.session.userId;
  const { currentDate } = req.body;

  const budgetData = await getBudgetByDate(userId, currentDate);
  if (!budgetData) {
    return res.status(404).send({ message: "Budget not found." });
  }

  return res.status(200).send({ data: budgetData });
};

export const getBudgetRemaining = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { budgetId } = req.params;
    // const { currentDate } = req.body;
    // const date = new Date(currentDate);
    // const options: Intl.DateTimeFormatOptions = {
    //   year: "numeric",
    //   month: "long",
    //   day: "numeric",
    // };

    // console.log("budgetId", budgetId);

    // const formattedDate: string = date.toLocaleDateString("en-US", options);

    const budget = await getBudgetByUserId(userId, Number(budgetId));
    // const dateStatus =
    //   new Date(budget.startDate) <= new Date(formattedDate) &&
    //   new Date(budget.endDate) >= new Date(formattedDate);

    if (!budget) {
      return res.status(200).send({
        remaining: 0,
        budget: {
          id: null,
          amount: 0,
          budgetType: 0,
          startDate: 0,
          endDate: 0,
          userId: userId,
        },
        totalExpenses: 0,
      });
    }

    const totalExpenses = await getExpensesSumByBudgetId(String(budget.id));
    const remaining = totalExpenses
      ? Number(budget.amount) - totalExpenses
      : Number(budget.amount);
    return res.status(200).send({
      remaining: remaining.toFixed(2),
      budget,
      totalExpenses: totalExpenses ? totalExpenses.toFixed(2) : 0,
    });
  } catch (error: any) {
    return res.status(500).send({ message: error?.message || "Server error" });
  }
};

export const getBudgetExpenses = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { budgetId, endDate, startDate } = req.body;

    const data = (await budgetExpenses(
      userId,
      budgetId,
      endDate,
      startDate
    )) as BudgetExpensesInterface;

    console.log("Data", data);

    if (!data) {
      return res.status(200).send({
        remaining: 0,
        id: null,
        amount: 0,
        budgetType: 0,
        startDate: 0,
        endDate: 0,
        userId: userId,
        totalExpenses: 0,
        expenses: [],
      });
    }
    const totalExpenses = await getExpensesSumByBudgetId(String(data.id));
    const remaining = totalExpenses
      ? Number(data.amount) - totalExpenses
      : Number(data.amount);

    return res.status(200).send({
      remaining: remaining.toFixed(2),
      budget_expenses: data,
      totalExpenses: totalExpenses ? totalExpenses.toFixed(2) : 0,
    });
  } catch (error: any) {
    return res.status(500).send({ message: error?.message || "Server error" });
  }
};

export const setBudgetActive = async (req: Request, res: Response) => {
  const { budgetId } = req.body;
  const userId = req.session.userId;

  const budget = await getBudgetById(budgetId);
  if (!budget) {
    return res.status(404).send({ message: "Budget not found." });
  }
  await setBudgetActiveRepo(budgetId);

  return res.status(200).send({ message: "Budget is successfully active" });
};
