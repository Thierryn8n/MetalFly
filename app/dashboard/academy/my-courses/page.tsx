"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import type { Course, CourseEnrollment, LessonProgress, CourseModule, Lesson } from "@/lib/types"
import { Play, Clock, CheckCircle, BookOpen, Users, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

interface CourseWithProgress extends Course {
  progress: number
}

export default function MyCoursesPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<CourseModule[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    try {
      setLoading(true)

      if (!profile) {
        toast({
          title: "Erro",
          description: "Perfil não encontrado",
          variant: "destructive"
        })
        return
      }

      // Buscar matrículas do usuário
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("user_id", profile.id)
        .order("enrolled_at", { ascending: false })

      if (enrollmentsError) throw enrollmentsError

      const enrollmentIds = enrollmentsData?.map((e: CourseEnrollment) => e.course_id) || []

      if (enrollmentIds.length === 0) {
        setEnrollments([])
        setCourses([])
        setLoading(false)
        return
      }

      // Buscar cursos matriculados
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .in("id", enrollmentIds)
        .eq("is_published", true)

      if (coursesError) throw coursesError

      // Buscar módulos e aulas
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .in("course_id", enrollmentIds)
        .order("order_index")

      if (modulesError) throw modulesError

      const moduleIds = modulesData?.map((m: CourseModule) => m.id) || []

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("order_index")

      if (lessonsError) throw lessonsError

      const lessonIds = lessonsData?.map((l: Lesson) => l.id) || []

      // Buscar progresso do usuário
      const { data: progressData, error: progressError } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", profile.id)
        .in("lesson_id", lessonIds)

      if (progressError) throw progressError

      setEnrollments(enrollmentsData || [])
      setCourses(coursesData || [])
      setModules(modulesData || [])
      setLessons(lessonsData || [])
      setProgress(progressData || [])
    } catch (error) {
      console.error("Erro ao buscar cursos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar seus cursos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateCourseProgress = (courseId: string): number => {
    const courseModules = modules.filter((m) => m.course_id === courseId)
    const courseLessons = lessons.filter((l) => 
      courseModules.some((m) => m.id === l.module_id)
    )
    
    if (courseLessons.length === 0) return 0

    const completedLessons = progress.filter((p) => 
      p.completed && courseLessons.some((l) => l.id === p.lesson_id)
    )

    return Math.round((completedLessons.length / courseLessons.length) * 100)
  }

  const getNextLesson = (courseId: string): Lesson | null => {
    const courseModules = modules.filter((m) => m.course_id === courseId)
    const courseLessons = lessons.filter((l) => 
      courseModules.some((m) => m.id === l.module_id)
    ).sort((a, b) => a.order_index - b.order_index)

    const completedLessonIds = progress
      .filter((p: LessonProgress) => p.completed)
      .map((p: LessonProgress) => p.lesson_id)

    const nextLesson = courseLessons.find((l) => !completedLessonIds.includes(l.id))
    return nextLesson || null
  }

  const continueCourse = async (courseId: string) => {
    const nextLesson = getNextLesson(courseId)
    if (nextLesson) {
      // Navegar para a página da aula
      window.location.href = `/dashboard/academy/courses/${courseId}/lessons/${nextLesson.id}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meus Cursos</h1>
        <p className="text-muted-foreground">
          Continue seu aprendizado e acompanhe seu progresso
        </p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Você ainda não está matriculado em nenhum curso.
            </p>
            <Button asChild>
              <Link href="/dashboard/academy">
                Explorar Cursos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">Todos os Cursos</TabsTrigger>
            <TabsTrigger value="in-progress">Em Andamento</TabsTrigger>
            <TabsTrigger value="completed">Concluídos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course: CourseWithProgress) => {
                const progress = calculateCourseProgress(course.id)
                const nextLesson = getNextLesson(course.id)
                const enrollment = enrollments.find((e) => e.course_id === course.id)

                return (
                  <Card key={course.id} className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-16 w-16 text-primary/50" />
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {course.description}
                          </CardDescription>
                        </div>
                        {course.is_free && (
                          <Badge variant="secondary" className="ml-2">Gratuito</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Iniciado em {new Date(enrollment?.enrolled_at || "").toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => continueCourse(course.id)}
                        className="w-full"
                        variant={progress === 100 ? "outline" : "default"}
                      >
                        {progress === 100 ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Concluído
                          </>
                        ) : progress === 0 ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Começar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continuar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter((course) => {
                  const progress = calculateCourseProgress(course.id)
                  return progress > 0 && progress < 100
                })
                .map((course: CourseWithProgress) => {
                  const progress = calculateCourseProgress(course.id)
                  const nextLesson = getNextLesson(course.id)
                  const enrollment = enrollments.find((e) => e.course_id === course.id)

                  return (
                    <Card key={course.id} className="overflow-hidden border-l-4 border-l-primary">
                      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="h-16 w-16 text-primary/50" />
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {course.description}
                            </CardDescription>
                          </div>
                          {course.is_free && (
                            <Badge variant="secondary" className="ml-2">Gratuito</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Continuação disponível</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => continueCourse(course.id)}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continuar
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter((course: CourseWithProgress) => calculateCourseProgress(course.id) === 100)
                .map((course: CourseWithProgress) => {
                  const enrollment = enrollments.find((e) => e.course_id === course.id)

                  return (
                    <Card key={course.id} className="overflow-hidden opacity-90">
                      <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CheckCircle className="h-16 w-16 text-green-500" />
                        )}
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{course.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {course.description}
                            </CardDescription>
                          </div>
                          <Badge variant="default" className="bg-green-500 text-white ml-2">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Progress value={100} className="h-2 bg-green-500" />
                          <div className="text-center text-sm text-green-600 font-medium">
                            Curso concluído com sucesso!
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Concluído em {new Date(enrollment?.enrolled_at || "").toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <Link href={`/dashboard/academy/courses/${course.id}`}>
                            Revisar Conteúdo
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}