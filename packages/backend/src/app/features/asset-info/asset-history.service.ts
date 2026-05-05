import { Injectable } from '@nestjs/common';
import { AssetTimelineEvent, AssetTimelineEventType, AssetTimelineResponseModel, AssetTimelineRequestModel } from '@bosvault/shared-models';
import { AssetInfoRepository } from './repositories/asset-info.repository';
import { AssetReturnHistoryRepository } from './repositories/asset-return-history.repository';
import { EmployeesRepository } from '../employees/repositories/employees.repository';
import { AssetAssignRepository } from './repositories/asset-assign.repository';
import { In } from 'typeorm';

@Injectable()
export class AssetHistoryService {
    constructor(
        private readonly assetRepo: AssetInfoRepository,
        private readonly returnHistoryRepo: AssetReturnHistoryRepository,
        private readonly employeeRepo: EmployeesRepository,
        private readonly assetAssignRepo: AssetAssignRepository
    ) { }

    async getAssetTimeline(reqModel: AssetTimelineRequestModel): Promise<AssetTimelineResponseModel> {
        try {
            const assetId = Number(reqModel.id);
            let companyId = Number(reqModel.companyId);

            const findCriteria: any = { id: assetId };
            if (companyId) findCriteria.companyId = companyId;

            const asset = await this.assetRepo.findOne({ where: findCriteria });
            if (!asset) {
                return new AssetTimelineResponseModel(false, 404, 'Asset not found', []);
            }

            companyId = asset.companyId;

            const events: AssetTimelineEvent[] = [];
            // 1. Creation Event
            if (asset.createdAt) {
                events.push({ id: `created-${asset.id}`, date: asset.createdAt, type: AssetTimelineEventType.CREATED, title: 'Asset Onboarded', description: `Asset ${asset.model || asset.serialNumber} added to inventory.`, performedBy: 'System' });
            }

            // 2. Fetch Assignments and Returns
            const assignments = await this.assetAssignRepo.find({ where: { assetId }, order: { assignedDate: 'DESC' } });
            const returnRecords = await this.returnHistoryRepo.find({ where: { assetId, companyId }, order: { returnDate: 'DESC' } });

            // 3. Resolve Employees
            const employeeIds = new Set<number>();
            assignments.forEach(a => employeeIds.add(Number(a.employeeId)));
            returnRecords.forEach(r => employeeIds.add(Number(r.employeeId)));
            if (asset.assignedToEmployeeId) employeeIds.add(Number(asset.assignedToEmployeeId));

            const employees = employeeIds.size > 0 ? await this.employeeRepo.find({ where: { id: In([...employeeIds]) } }) : [];
            const employeeMap = new Map(employees.map(e => [Number(e.id), `${e.firstName} ${e.lastName}`]));

            // 4. Build Assignment Events
            for (const assign of assignments) {
                const empName = employeeMap.get(Number(assign.employeeId)) || 'Unknown Employee';

                // Add ASSIGNED event
                const isCurrent = assign.returnDate === null && !assign.remarks?.includes('Returned:');
                events.push({
                    id: `assigned-${assign.id}`,
                    date: assign.assignedDate,
                    type: AssetTimelineEventType.ASSIGNED,
                    title: isCurrent ? `Currently Assigned to ${empName}` : `Assigned to ${empName}`,
                    description: isCurrent ? 'Active assignment' : 'Asset assigned',
                    employeeName: empName,
                    employeeId: Number(assign.employeeId)
                });

                // If assignment is closed but NOT in returnRecords (e.g. transfer), add a generic END/RETURN event
                // We check if a return record exists for this employee/date roughly
                if (assign.returnDate) {
                    const hasReturnRecord = returnRecords.some(r =>
                        Number(r.employeeId) === Number(assign.employeeId) &&
                        Math.abs(new Date(r.returnDate).getTime() - new Date(assign.returnDate).getTime()) < 60000 // 1 min tolerance
                    );

                    if (!hasReturnRecord) {
                        events.push({
                            id: `ended-${assign.id}`,
                            date: assign.returnDate,
                            type: AssetTimelineEventType.RETURNED, // Use RETURNED or a custom ENDED type
                            title: `Assignment Ended (${empName})`,
                            description: assign.returnRemarks || assign.remarks || 'Assignment ended (Transfer/Update)',
                            employeeName: empName,
                            employeeId: Number(assign.employeeId)
                        });
                    }
                }
            }

            // 5. Build Return History Events (These contain more specific details like condition)
            for (const record of returnRecords) {
                const empName = employeeMap.get(Number(record.employeeId)) || 'Unknown Employee';
                events.push({
                    id: `returned-${record.id}`,
                    date: record.returnDate,
                    type: AssetTimelineEventType.RETURNED,
                    title: `Returned by ${empName}`,
                    description: record.returnReason || 'No reason provided',
                    employeeName: empName,
                    employeeId: Number(record.employeeId),
                    metadata: { condition: record.assetCondition, remarks: record.remarks }
                });
            }

            // Sort by date descending
            events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return new AssetTimelineResponseModel(true, 200, 'Timeline fetched successfully', events);
        } catch (error) {
            throw error;
        }
    }
}
