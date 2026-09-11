import {
    coursesRepository,
    subjectsRepository,
    type CreateSubjectInput,
    type UpdateSubjectInput,
} from "@/src/database";
import { DuplicateSubjectNameError, SubjectInUseError, SubjectNotFoundError } from "@/src/presentation/features/shared";

export type SubjectInput = {
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
};

export type SubjectPatch = Partial<SubjectInput>;

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSubjectInput(input: SubjectInput): CreateSubjectInput {
  return {
    name: normalizeSpaces(input.name),
    icon: normalizeSpaces(input.icon),
    color: normalizeSpaces(input.color),
    isDefault: input.isDefault ?? false,
  };
}

function normalizeSubjectPatch(input: SubjectPatch): UpdateSubjectInput {
  return {
    ...(input.name !== undefined ? { name: normalizeSpaces(input.name) } : {}),
    ...(input.icon !== undefined ? { icon: normalizeSpaces(input.icon) } : {}),
    ...(input.color !== undefined ? { color: normalizeSpaces(input.color) } : {}),
    ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
  };
}

function wrapDuplicateSubject(error: unknown): never {
  if (error instanceof Error && /unique|constraint/i.test(error.message)) {
    throw new DuplicateSubjectNameError(error);
  }
  throw error;
}

export async function listSubjects() {
  return subjectsRepository.findAll();
}

export async function getSubject(id: string) {
  const subject = await subjectsRepository.findById(id);
  if (!subject) throw new SubjectNotFoundError();
  return subject;
}

export async function createSubject(input: SubjectInput) {
  try {
    return await subjectsRepository.create(normalizeSubjectInput(input));
  } catch (error) {
    wrapDuplicateSubject(error);
  }
}

export async function updateSubject(id: string, input: SubjectPatch) {
  if (!(await subjectsRepository.findById(id))) throw new SubjectNotFoundError();
  try {
    return await subjectsRepository.update(id, normalizeSubjectPatch(input));
  } catch (error) {
    wrapDuplicateSubject(error);
  }
}

export async function deleteSubject(id: string) {
  if (!(await subjectsRepository.findById(id))) throw new SubjectNotFoundError();
  if ((await coursesRepository.findAllBySubject(id)).length > 0) throw new SubjectInUseError();
  await subjectsRepository.remove(id);
}
