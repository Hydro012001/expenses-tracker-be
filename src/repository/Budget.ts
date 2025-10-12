import { Op } from "sequelize";
import { BudgetAttributes } from "../interface/Budget";
import { BudgetRequestInterface } from "../interface/request/budgetRequestInterface";
import { BudgetExpensesInterface } from "../interface/Budget";
import { Budget } from "../model/Budget";
import { Expenses } from "../model/Expeneses";

export const addBudget = async (budget: BudgetRequestInterface) => {
  return await Budget.create(budget);
};

export const getAllBudgetsByUserId = async (userId: string) => {
  const budgets = await Budget.findAll({
    where: {
      userId: userId,
    },
    order: [["status_flag", "DESC"]],
    raw: true,
  });

  return budgets as unknown as BudgetRequestInterface[];
};

export const getBudgetById = async (budgetId: string) => {
  const budget = await Budget.findOne({
    where: {
      id: budgetId,
    },
    raw: true,
  });

  return budget as unknown as BudgetAttributes;
};

export const getBudgetByDate = async (userId: string, currentDate: string) => {
  const budget = await Budget.findOne({
    where: {
      userId: userId,
      startDate: {
        [Op.lte]: currentDate,
      },
      endDate: {
        [Op.gte]: currentDate,
      },
    },
    raw: true,
  });

  return budget as unknown as BudgetAttributes;
};

export const getBudgetByUserId = async (userId: string, budgetId: number) => {
  const budget = await Budget.findOne({
    where: {
      userId: userId,
      id: budgetId,
      // startDate: {
      //   [Op.lte]: formattedDate,
      // },
      // endDate: {
      //   [Op.gte]: formattedDate,
      // },
    },
    raw: true,
  });

  return budget as unknown as BudgetAttributes;
};

export const budgetExpenses = async (
  userId: string,
  budgetId: string,
  endDate?: Date,
  startDate?: Date
) => {
  const budget_expenses = await Budget.findOne({
    include: [
      {
        model: Expenses,
        as: "expenses",
        required: false,
        where:
          startDate && endDate
            ? {
                budgetId: budgetId,
                createdAt: {
                  [Op.between]: [startDate, endDate],
                },
              }
            : undefined,
      },
    ],
    where: {
      userId,
      id: budgetId,
    },
  });

  return budget_expenses as unknown as BudgetExpensesInterface;
};
export const setBudgetActiveRepo = async (budgetId: string) => {
  await Budget.update({ status_flag: 1 }, { where: { id: budgetId } });
};
