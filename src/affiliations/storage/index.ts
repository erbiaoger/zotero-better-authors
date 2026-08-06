import { AffiliationDatabase } from "./database";
import { AffiliationRepository } from "./repository";

export const affiliationDatabase = new AffiliationDatabase();
export const affiliationRepository = new AffiliationRepository(affiliationDatabase);
