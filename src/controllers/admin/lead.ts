import { Request, Response } from "express"
import LeadModel from "../../models/lead"

const STATUS = ["user", "lead"]

export const getAllLeads = async (req: Request, res: Response) => {
	const limit = +(req.query.limit ?? "20")
	const offset = +(req.query.offset ?? "0")

	const leads = await LeadModel.findAll({ limit, offset, order: [["lead_id", "ASC"]] })

	if (leads) {
		res.json(leads)
	} else {
		res.status(404).json({
			msg: `Leads not found`,
		})
	}
}

export const updateLeadStatus = async (req: Request, res: Response) => {
	const newStatus = req.body.status
	const leadId = req.params.id

	if (!STATUS.includes(newStatus)) {
		return res.status(400).json({
			msg: `Invalid value for status.`,
		})
	}

	const lead = await LeadModel.findOne({
		where: {
			lead_id: leadId,
		},
	})

	if (!lead) {
		return res.status(404).json({
			msg: `Lead not found`,
		})
	}

	await LeadModel.update(
		{ status: newStatus },
		{
			where: { lead_id: leadId },
		}
	)

	const updatedLead = await LeadModel.findOne({
		where: {
			lead_id: leadId,
		},
	})

	res.json(updatedLead)
}

export async function setLeadToUser(email: string) {
  try {
    await LeadModel.update(
      { status: 'user' },
      {
        where: { email: email.trim() },
      }
    )
  } catch (err) {
    //console.log(err)
  }
}
