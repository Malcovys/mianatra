import type { Subject } from "@/src/db";
import { AppButton, AppCard, AppScreen, AppText } from "@/src/presentation/components/shared";
import { Input, InputField } from "@/src/presentation/components/ui/input";
import {
    normalizeCourseImportSubjectName,
    resolveCourseImportSubjectForCreation,
    resolveInitialCourseImportSubject,
    shouldReuseCompiledCourse,
} from "@/src/presentation/features/course-import";
import { AddPageButton, CoursePageGrid, ImportStepHeader } from "@/src/presentation/features/course-import/components";
import { compileCourse, getCourseImportDefaults, getOrCreateCourseImportSubject } from "@/src/presentation/features/course-import/services/course-import.service";
import { expoGalleryImportService } from "@/src/presentation/features/course-import/services/gallery-import.expo";
import {
    GalleryImportError,
    MAX_GALLERY_COURSE_PAGES,
    moveSelectedCoursePage,
    removeSelectedCoursePage,
    type SelectedCoursePage,
} from "@/src/presentation/features/course-import/services/gallery-import.service";
import { useCourseProcessing } from "@/src/presentation/features/course-processing";
import { listSubjects } from "@/src/presentation/features/subjects";
import { colors, fonts } from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AddCourseStep = 1 | 2 | 3;

export default function AddCourseScreen() {
  const insets = useSafeAreaInsets();
  const { subjectId } = useLocalSearchParams<{ subjectId?: string }>();
  const requestedSubjectId = Array.isArray(subjectId) ? subjectId[0] : subjectId;
  const [step, setStep] = useState<AddCourseStep>(1);
  const [pages, setPages] = useState<SelectedCoursePage[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("Nouveau cours");
  const [grade, setGrade] = useState("2nde");
  const [subjectName, setSubjectName] = useState("SVT");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledCourseId, setCompiledCourseId] = useState<string | null>(null);
  const [compiledSubjectId, setCompiledSubjectId] = useState<string | null>(null);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCompileInFlightRef = useRef(false);
  const isSaveInFlightRef = useRef(false);
  const processing = useCourseProcessing(compiledCourseId ?? undefined);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCourseImportDefaults(), listSubjects()])
      .then(([defaults, availableSubjects]) => {
        if (!mounted) {
          return;
        }
        setSubjects(availableSubjects);
        const initialSubject = resolveInitialCourseImportSubject({
          requestedSubjectId,
          subjects: availableSubjects,
          defaultSubjectName: defaults.subjectName,
        });
        setSubjectName(initialSubject.subjectName);
        setSelectedSubjectId(initialSubject.selectedSubjectId);
        setTitle(defaults.title);
        setGrade(defaults.grade);
      })
      .catch(() => {
        if (mounted) {
          setErrorMessage("Impossible de charger les matières disponibles.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [requestedSubjectId]);

  function removePage(id: string) {
    setPages((currentPages) => removeSelectedCoursePage(currentPages, id));
  }

  function movePage(id: string, direction: "left" | "right") {
    setPages((currentPages) => moveSelectedCoursePage(currentPages, id, direction));
  }

  function goToPagesStep() {
    if (!normalizeCourseImportSubjectName(subjectName)) {
      const message = "Choisis ou crée une matière avant de continuer.";
      setErrorMessage(message);
      Alert.alert("Matière requise", message);
      return;
    }
    setErrorMessage(null);
    setStep(2);
  }

  async function chooseImages() {
    setErrorMessage(null);
    setIsPicking(true);
    try {
      const result = await expoGalleryImportService.pickPages();
      if (result.status === "cancelled") {
        return;
      }
      const importToken = Date.now().toString(36);
      if (pages.length + result.pages.length > MAX_GALLERY_COURSE_PAGES) {
        setErrorMessage(`Seules les ${MAX_GALLERY_COURSE_PAGES} premières pages sont conservées.`);
      }
      setPages((currentPages) => {
        const nextImportedPages = result.pages.map((page, pageIndex) => ({
          ...page,
          id: `${importToken}-${currentPages.length + pageIndex}-${page.id}`,
        }));
        const mergedPages = [...currentPages, ...nextImportedPages].slice(0, MAX_GALLERY_COURSE_PAGES);
        return mergedPages.map((page, pageIndex) => ({ ...page, pageIndex }));
      });
    } catch (error) {
      const message = error instanceof GalleryImportError ? error.message : "Impossible d’ouvrir la galerie.";
      setErrorMessage(message);
      Alert.alert("Import impossible", message);
    } finally {
      setIsPicking(false);
    }
  }

  async function compileSelectedPages() {
    if (isCompileInFlightRef.current) {
      return;
    }
    if (shouldReuseCompiledCourse(compiledCourseId)) {
      setStep(3);
      return;
    }
    if (!subjectName.trim()) {
      const message = "Renseigne la matière du cours.";
      setErrorMessage(message);
      Alert.alert("Cours impossible", message);
      return;
    }
    if (pages.length === 0) {
      const message = "Choisis au moins une image avant de créer le cours.";
      setErrorMessage(message);
      Alert.alert("Aucune page", message);
      return;
    }

    setErrorMessage(null);
    isCompileInFlightRef.current = true;
    setIsCompiling(true);
    try {
      const subject = await resolveCourseImportSubjectForCreation({
        subjectName,
        selectedSubjectId,
        subjects,
        getOrCreateSubject: getOrCreateCourseImportSubject,
      });
      const result = await expoGalleryImportService.createCourse({
        subjectId: subject.id,
        title,
        grade,
        pages,
      });
      if (!result.course.id) {
        throw new GalleryImportError("course_creation_failed", "Le cours a été créé sans identifiant exploitable.");
      }
      await compileCourse(result.course.id);
      setCompiledCourseId(result.course.id);
      setCompiledSubjectId(subject.id);
      setSelectedSubjectId(subject.id);
      setSubjectName(subject.name);
      setStep(3);
    } catch (error) {
      const message = error instanceof GalleryImportError ? error.message : "Impossible de compiler les pages du cours.";
      setErrorMessage(message);
      Alert.alert("Compilation impossible", message);
    } finally {
      isCompileInFlightRef.current = false;
      setIsCompiling(false);
    }
  }

  async function saveAnalyzedCourse() {
    if (isSaveInFlightRef.current || !processing.pendingAnalysis) {
      return;
    }
    isSaveInFlightRef.current = true;
    setIsSavingCourse(true);
    try {
      await processing.confirmAndContinue?.();
      if (compiledCourseId) {
        router.replace({
          pathname: "/course/[courseId]",
          params: { courseId: compiledCourseId, subjectId: compiledSubjectId ?? selectedSubjectId ?? undefined },
        });
      }
    } catch {
      // Le contrôleur expose déjà le message utilisateur dans processing.error.
    } finally {
      isSaveInFlightRef.current = false;
      setIsSavingCourse(false);
    }
  }

  const normalizedSubjectName = normalizeCourseImportSubjectName(subjectName);
  const isProcessingBusy = ["analyzing", "persisting", "generating_sheet", "generating_exercises"].includes(processing.status);
  const detectedAnalysis = processing.pendingAnalysis ?? processing.result.analysis;

  return (
    <AppScreen
      contentClassName="gap-5 pt-2"
      contentStyle={{ paddingBottom: Math.max(insets.bottom + 28, 58) }}
    >
      <ImportStepHeader
        currentStep={step}
        onOptionsPress={() => Alert.alert("Options", "Options disponibles prochainement.")}
      />

      {step === 1 ? (
        <>
          <View className="gap-1.5">
            <AppText
              variant="heading"
              className="text-[24px] leading-[30px]"
              style={{ fontFamily: fonts.bold }}
            >
              Choisis la matière
            </AppText>
            <AppText tone="secondary" className="max-w-[390px] text-[15px] leading-[22px]">
              Sélectionne une matière existante ou ajoute une nouvelle matière.
            </AppText>
          </View>

          {subjects.length > 0 ? (
            <View className="flex-row flex-wrap gap-2.5">
              {subjects.map((subject) => {
                const isSelected = selectedSubjectId === subject.id;
                return (
                  <Pressable
                    key={subject.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSubjectName(subject.name);
                      setSelectedSubjectId(subject.id);
                    }}
                    className={[
                      "min-h-10 rounded-full border px-4 py-2.5 active:opacity-80",
                      isSelected ? "border-[#D94B24] bg-[#D94B24]" : "border-[#E8D9C7] bg-[#FFFDF8]",
                    ].join(" ")}
                    style={
                      isSelected
                        ? {
                            shadowColor: colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.18,
                            shadowRadius: 8,
                            elevation: 3,
                          }
                        : undefined
                    }
                  >
                    <AppText
                      variant="label"
                      tone={isSelected ? "inverse" : "primary"}
                      className="text-[14px] leading-5"
                      style={{ fontFamily: fonts.bold }}
                    >
                      {subject.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View className="gap-2">
            <AppText variant="label" className="text-[15px] leading-5">
              Nouvelle matière
            </AppText>
            <Input variant="rounded" size="xl" className="h-[54px] border-[#E8D9C7] bg-white px-1">
              <InputField
                value={subjectName}
                onChangeText={(nextSubjectName) => {
                  setSubjectName(nextSubjectName);
                  setSelectedSubjectId(null);
                }}
                placeholder="SVT"
                placeholderTextColor="#8D8077"
                className="text-[17px] leading-6 text-[#2F241F]"
                style={{ fontFamily: fonts.medium }}
                returnKeyType="done"
              />
            </Input>
          </View>

          <AppButton
            title="Continuer"
            iconName="arrow-right"
            iconPosition="right"
            disabled={!normalizedSubjectName}
            onPress={goToPagesStep}
            className="min-h-[54px]"
          />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <View className="gap-1.5">
            <AppText
              variant="heading"
              className="text-[24px] leading-[30px]"
              style={{ fontFamily: fonts.bold }}
            >
              Ajoute les pages de ton cours
            </AppText>
            <AppText tone="secondary" className="max-w-[390px] text-[15px] leading-[22px]">
              Sélectionne, supprime et réordonne de 1 à {MAX_GALLERY_COURSE_PAGES} images.
            </AppText>
          </View>

          <View className="gap-3">
            <View className="gap-2">
              <AppText variant="label" className="text-[15px] leading-5">
                Titre du cours
              </AppText>
              <Input variant="rounded" size="xl" className="h-[54px] border-[#E8D9C7] bg-white px-1">
                <InputField
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Nouveau cours"
                  placeholderTextColor="#8D8077"
                  className="text-[17px] leading-6 text-[#2F241F]"
                  style={{ fontFamily: fonts.medium }}
                  returnKeyType="done"
                />
              </Input>
            </View>
            <View className="gap-2">
              <AppText variant="label" className="text-[15px] leading-5">
                Classe
              </AppText>
              <Input variant="rounded" size="xl" className="h-[54px] border-[#E8D9C7] bg-white px-1">
                <InputField
                  value={grade}
                  onChangeText={setGrade}
                  placeholder="2nde"
                  placeholderTextColor="#8D8077"
                  className="text-[17px] leading-6 text-[#2F241F]"
                  style={{ fontFamily: fonts.medium }}
                  returnKeyType="done"
                />
              </Input>
            </View>
            <View className="self-start rounded-full bg-[#FAF1E2] px-3 py-1.5">
              <AppText tone="secondary" className="text-[13px] leading-4">
                Matière : {normalizedSubjectName}
              </AppText>
            </View>
          </View>

          {pages.length > 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <AppText variant="subtitle">Pages sélectionnées</AppText>
                <AppText variant="label" tone="secondary">
                  {pages.length} / {MAX_GALLERY_COURSE_PAGES}
                </AppText>
              </View>
              <CoursePageGrid
                pages={pages}
                onRemove={removePage}
                onMoveLeft={(id) => movePage(id, "left")}
                onMoveRight={(id) => movePage(id, "right")}
              />
            </View>
          ) : (
            <View className="rounded-2xl border border-[#E8D9C7] bg-[#FFFDF8]/70 px-4 py-3">
              <AppText variant="label" className="text-[15px] leading-5">
                Aucune page ajoutée
              </AppText>
              <AppText tone="secondary" className="mt-1 text-[14px] leading-5">
                Choisis les photos ou captures de ton cours pour continuer.
              </AppText>
            </View>
          )}

          <AddPageButton onPress={chooseImages} disabled={isPicking || isCompiling || Boolean(compiledCourseId)} />
          <View className="flex-row gap-3">
            <AppButton title="Retour" iconName="arrow-left" variant="secondary" className="min-h-[52px] flex-1" onPress={() => setStep(1)} />
            <AppButton
              title="Compiler les pages"
              iconName="layer-group"
              className="min-h-[52px] flex-[1.8]"
              loading={isCompiling}
              disabled={pages.length === 0 || !normalizedSubjectName || isPicking || isCompiling}
              accessibilityHint="Compile les pages sélectionnées avant l'analyse"
              onPress={compileSelectedPages}
            />
          </View>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <View className="gap-2">
            <AppText variant="heading">Analyse du cours</AppText>
            <AppText tone="secondary">Vérifie le titre, la matière, les pages et les notions avant l’enregistrement.</AppText>
          </View>

          <AppCard className="gap-4">
            <View className="gap-2">
              <AppText variant="subtitle">Cours compilé</AppText>
              <AppText tone="secondary">
                {title} • {normalizedSubjectName} • {pages.length} page(s)
              </AppText>
            </View>

            <View className="gap-2">
              <AppText variant="label">Traitement</AppText>
              <AppText tone="secondary">{processing.progress.message}</AppText>
            </View>

            {detectedAnalysis ? (
              <View className="gap-3">
                <View className="gap-1">
                  <AppText variant="label">Titre détecté</AppText>
                  <AppText tone="secondary">{detectedAnalysis.detectedTitle}</AppText>
                </View>
                <View className="gap-1">
                  <AppText variant="label">Matière détectée</AppText>
                  <AppText tone="secondary">{detectedAnalysis.detectedSubject}</AppText>
                </View>
                <View className="gap-1">
                  <AppText variant="label">Pages analysées</AppText>
                  <AppText tone="secondary">
                    {detectedAnalysis.successfulPageCount} / {detectedAnalysis.pageResults.length} page(s)
                  </AppText>
                  {detectedAnalysis.failedPageCount > 0 ? (
                    <AppText tone="error">{detectedAnalysis.failedPageCount} page(s) non analysée(s)</AppText>
                  ) : null}
                </View>
                <View className="gap-1">
                  <AppText variant="label">Notions détectées</AppText>
                  <AppText tone="secondary">{detectedAnalysis.concepts.length} notion(s)</AppText>
                </View>
                {detectedAnalysis.concepts.slice(0, 6).map((concept) => (
                  <AppText key={concept.name} tone="secondary">
                    • {concept.name}
                  </AppText>
                ))}
              </View>
            ) : null}

            {processing.error ? <AppText tone="error">{processing.error}</AppText> : null}
          </AppCard>

          {!detectedAnalysis ? (
            <AppButton
              title="Analyser"
              iconName="magic"
              loading={isProcessingBusy}
              disabled={!compiledCourseId || !processing.hasLoadedDetail}
              onPress={() => void processing.startProcessing?.()?.catch(() => undefined)}
            />
          ) : (
            <AppButton
              title="Enregistrer le cours"
              iconName="save"
              loading={isSavingCourse || isProcessingBusy}
              disabled={!processing.pendingAnalysis}
              onPress={() => void saveAnalyzedCourse()}
            />
          )}

          {processing.error ? (
            <AppButton title="Réessayer" iconName="redo" variant="secondary" onPress={() => void processing.retry?.()?.catch(() => undefined)} />
          ) : null}
        </>
      ) : null}

      {errorMessage ? (
        <AppText variant="caption" tone="error">
          {errorMessage}
        </AppText>
      ) : null}
    </AppScreen>
  );
}
