/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';
import { AdminService } from './services/AdminService';
import { ChatService } from './services/ChatService';
import { ComplaintService } from './services/ComplaintService';
import { ContractService } from './services/ContractService';
import { HouseService } from './services/HouseService';
import { RentService } from './services/RentService';
import { RepairService } from './services/RepairService';
import { SearchService } from './services/SearchService';
import { UserService } from './services/UserService';
type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;
export class rentHouse {
    public readonly admin: AdminService;
    public readonly chat: ChatService;
    public readonly complaint: ComplaintService;
    public readonly contract: ContractService;
    public readonly house: HouseService;
    public readonly rent: RentService;
    public readonly repair: RepairService;
    public readonly search: SearchService;
    public readonly user: UserService;
    public readonly request: BaseHttpRequest;
    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '/api/v1',
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });
        this.admin = new AdminService(this.request);
        this.chat = new ChatService(this.request);
        this.complaint = new ComplaintService(this.request);
        this.contract = new ContractService(this.request);
        this.house = new HouseService(this.request);
        this.rent = new RentService(this.request);
        this.repair = new RepairService(this.request);
        this.search = new SearchService(this.request);
        this.user = new UserService(this.request);
    }
}

