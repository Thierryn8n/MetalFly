"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/use-toast"
import type { Course, CourseModule, Lesson } from "@/lib/types"
import { Plus, Edit, Trash2, Eye, Play, BookOpen, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AcademyManagementPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [courses, setCourses] = useState<Course[]>([])
  const [modules, setModules] = useState<CourseModule[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({})
  const [courseTouched, setCourseTouched] = useState<Record<string, boolean>>({})

  // Estados para formulários
  const [courseForm, setCourseForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: 0,
    is_free: false,
    is_published: false,
  })

  const [moduleForm, setModuleForm] = useState({
    course_id: "",
    title: "",
    description: "",
    order_index: 0,
  })

  const [lessonForm, setLessonForm] = useState({
    module_id: "",
    title: "",
    description: "",
    video_url: "",
    content: "",
    duration_minutes: 0,
    is_free: false,
    order_index: 0,
  })

  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    fetchAcademyData()
  }, [])

  const fetchAcademyData = async () => {
    try {
      setLoading(true)

      const [coursesRes, modulesRes, lessonsRes] = await Promise.all([
        supabase.from("courses").select("*").order("created_at", { ascending: false }),
        supabase.from("course_modules").select("*").order("order_index"),
        supabase.from("lessons").select("*").order("order_index"),
      ])

      if (coursesRes.error) throw coursesRes.error
      if (modulesRes.error) throw modulesRes.error
      if (lessonsRes.error) throw lessonsRes.error

      setCourses(coursesRes.data || [])
      setModules(modulesRes.data || [])
      setLessons(lessonsRes.data || [])
    } catch (error) {
      console.error("Erro ao buscar dados da academia:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da academia",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const validateCourseField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) return 'O título do curso é obrigatório'
        if (value.length < 5) return 'O título deve ter pelo menos 5 caracteres'
        if (value.length > 100) return 'O título não pode ter mais de 100 caracteres'
        break
      case 'slug':
        if (!value || value.trim().length === 0) return 'O slug é obrigatório'
        if (!/^[a-z0-9-]+$/.test(value)) return 'O slug deve conter apenas letras minúsculas, números e hífens'
        if (value.length < 3) return 'O slug deve ter pelo menos 3 caracteres'
        if (value.length > 50) return 'O slug não pode ter mais de 50 caracteres'
        break
      case 'description':
        if (!value || value.trim().length === 0) return 'A descrição é obrigatória'
        if (value.length < 20) return 'A descrição deve ter pelo menos 20 caracteres'
        if (value.length > 1000) return 'A descrição não pode ter mais de 1000 caracteres'
        break
      case 'price':
        if (value < 0) return 'O preço não pode ser negativo'
        if (value > 10000) return 'O preço não pode ser maior que R$ 10.000'
        break
    }
    return undefined
  }

  const handleCourseChange = (field: string, value: any) => {
    setCourseForm(prev => ({ ...prev, [field]: value }))
    setCourseTouched(prev => ({ ...prev, [field]: true }))
    
    const error = validateCourseField(field, value)
    setCourseErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const handleCourseBlur = (field: string) => {
    setCourseTouched(prev => ({ ...prev, [field]: true }))
    const error = validateCourseField(field, courseForm[field as keyof typeof courseForm])
    setCourseErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const validateCourseForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    Object.keys(courseForm).forEach(field => {
      const error = validateCourseField(field, courseForm[field as keyof typeof courseForm])
      if (error) newErrors[field] = error
    })
    
    setCourseErrors(newErrors)
    setCourseTouched(Object.keys(courseForm).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    
    return Object.keys(newErrors).length === 0
  }

  const handleSaveCourse = async () => {
    if (!validateCourseForm()) {
      toast({
        title: "Erro",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive"
      })
      return
    }

    try {
      setSaving(true)

      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update(courseForm)
          .eq("id", editingCourse.id)

        if (error) throw error
        toast({
              title: "Sucesso",
              description: "Curso atualizado com sucesso!"
            })
      } else {
        const { error } = await supabase.from("courses").insert([courseForm])
        if (error) throw error
        toast({
              title: "Sucesso",
              description: "Curso criado com sucesso!"
            })
      }

      await fetchAcademyData()
      resetCourseForm()
    } catch (error) {
      console.error("Erro ao salvar curso:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar curso",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveModule = async () => {
    try {
      setSaving(true)

      if (editingModule) {
        const { error } = await supabase
          .from("course_modules")
          .update(moduleForm)
          .eq("id", editingModule.id)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Módulo atualizado com sucesso!"
        })
      } else {
        const { error } = await supabase.from("course_modules").insert([moduleForm])
        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Módulo criado com sucesso!"
        })
      }

      await fetchAcademyData()
      resetModuleForm()
    } catch (error) {
      console.error("Erro ao salvar módulo:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar módulo",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLesson = async () => {
    try {
      setSaving(true)

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonForm)
          .eq("id", editingLesson.id)

        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Aula atualizada com sucesso!"
        })
      } else {
        const { error } = await supabase.from("lessons").insert([lessonForm])
        if (error) throw error
        toast({
          title: "Sucesso",
          description: "Aula criada com sucesso!"
        })
      }

      await fetchAcademyData()
      resetLessonForm()
    } catch (error) {
      console.error("Erro ao salvar aula:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar aula",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso? Todas as aulas serão perdidas.")) return

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId)
      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Curso excluído com sucesso!"
      })
      await fetchAcademyData()
    } catch (error) {
      console.error("Erro ao excluir curso:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir curso",
        variant: "destructive"
      })
    }
  }

  const resetCourseForm = () => {
    setCourseForm({
      title: "",
      slug: "",
      description: "",
      price: 0,
      is_free: false,
      is_published: false,
    })
    setEditingCourse(null)
  }

  const resetModuleForm = () => {
    setModuleForm({
      course_id: "",
      title: "",
      description: "",
      order_index: 0,
    })
    setEditingModule(null)
  }

  const resetLessonForm = () => {
    setLessonForm({
      module_id: "",
      title: "",
      description: "",
      video_url: "",
      content: "",
      duration_minutes: 0,
      is_free: false,
      order_index: 0,
    })
    setEditingLesson(null)
  }

  const startEditCourse = (course: Course) => {
    setCourseForm({
      title: course.title,
      slug: course.slug,
      description: course.description || "",
      price: course.price,
      is_free: course.is_free,
      is_published: course.is_published,
    })
    setEditingCourse(course)
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
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento da Academia</h1>
        <p className="text-muted-foreground">
          Gerencie cursos, módulos e aulas da sua plataforma de ensino
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Módulos
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aulas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cursos</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={resetCourseForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
                  <DialogDescription>
                    {editingCourse ? "Edite as informações do curso" : "Crie um novo curso para sua plataforma"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={courseForm.title}
                      onChange={(e) => handleCourseChange('title', e.target.value)}
                      onBlur={() => handleCourseBlur('title')}
                      placeholder="Título do curso"
                      className={courseErrors.title && courseTouched.title ? "border-red-500" : ""}
                    />
                    {courseErrors.title && courseTouched.title && (
                      <p className="text-sm text-red-500">{courseErrors.title}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={courseForm.slug}
                      onChange={(e) => handleCourseChange('slug', e.target.value)}
                      onBlur={() => handleCourseBlur('slug')}
                      placeholder="slug-do-curso"
                      className={courseErrors.slug && courseTouched.slug ? "border-red-500" : ""}
                    />
                    {courseErrors.slug && courseTouched.slug && (
                      <p className="text-sm text-red-500">{courseErrors.slug}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={courseForm.description}
                      onChange={(e) => handleCourseChange('description', e.target.value)}
                      onBlur={() => handleCourseBlur('description')}
                      placeholder="Descrição do curso"
                      rows={3}
                      className={courseErrors.description && courseTouched.description ? "border-red-500" : ""}
                    />
                    {courseErrors.description && courseTouched.description && (
                      <p className="text-sm text-red-500">{courseErrors.description}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={courseForm.price}
                      onChange={(e) => handleCourseChange('price', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleCourseBlur('price')}
                      placeholder="0.00"
                      className={courseErrors.price && courseTouched.price ? "border-red-500" : ""}
                    />
                    {courseErrors.price && courseTouched.price && (
                      <p className="text-sm text-red-500">{courseErrors.price}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_free"
                        checked={courseForm.is_free}
                        onChange={(e) => setCourseForm({ ...courseForm, is_free: e.target.checked })}
                      />
                      <Label htmlFor="is_free">Curso Gratuito</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_published"
                        checked={courseForm.is_published}
                        onChange={(e) => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                      />
                      <Label htmlFor="is_published">Publicado</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetCourseForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveCourse} disabled={saving}>
                    {saving ? "Salvando..." : editingCourse ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">{course.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.is_free ? (
                          <span className="text-green-600 font-medium">Gratuito</span>
                        ) : (
                          <span className="font-medium">R$ {course.price.toFixed(2)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                          {course.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditCourse(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                {courses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum curso encontrado. Crie seu primeiro curso!
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Módulos</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={resetModuleForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
                  <DialogDescription>
                    {editingModule ? "Edite as informações do módulo" : "Crie um novo módulo para organizar suas aulas"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="course_id">Curso</Label>
                    <Select
                      value={moduleForm.course_id}
                      onValueChange={(value) => setModuleForm({ ...moduleForm, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um curso" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="module_title">Título</Label>
                    <Input
                      id="module_title"
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="Título do módulo"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="module_description">Descrição</Label>
                    <Textarea
                      id="module_description"
                      value={moduleForm.description}
                      onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                      placeholder="Descrição do módulo"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="module_order">Ordem</Label>
                    <Input
                      id="module_order"
                      type="number"
                      value={moduleForm.order_index}
                      onChange={(e) => setModuleForm({ ...moduleForm, order_index: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetModuleForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveModule} disabled={saving}>
                    {saving ? "Salvando..." : editingModule ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => {
                    const course = courses.find((c) => c.id === module.course_id)
                    return (
                      <TableRow key={module.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{module.title}</div>
                            <div className="text-sm text-muted-foreground">{module.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{course?.title || "Curso não encontrado"}</TableCell>
                        <TableCell>{module.order_index}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setModuleForm({
                                  course_id: module.course_id,
                                  title: module.title,
                                  description: module.description || "",
                                  order_index: module.order_index,
                                })
                                setEditingModule(module)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {modules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum módulo encontrado. Crie seu primeiro módulo!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Aulas</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={resetLessonForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Aula
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{editingLesson ? "Editar Aula" : "Nova Aula"}</DialogTitle>
                  <DialogDescription>
                    {editingLesson ? "Edite as informações da aula" : "Crie uma nova aula para seu módulo"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="lesson_module_id">Módulo</Label>
                    <Select
                      value={lessonForm.module_id}
                      onValueChange={(value) => setLessonForm({ ...lessonForm, module_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lesson_title">Título</Label>
                    <Input
                      id="lesson_title"
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                      placeholder="Título da aula"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lesson_description">Descrição</Label>
                    <Textarea
                      id="lesson_description"
                      value={lessonForm.description}
                      onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Descrição da aula"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lesson_video">URL do Vídeo</Label>
                    <Input
                      id="lesson_video"
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lesson_content">Conteúdo</Label>
                    <Textarea
                      id="lesson_content"
                      value={lessonForm.content}
                      onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                      placeholder="Conteúdo da aula (texto, markdown, etc.)"
                      rows={6}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="lesson_duration">Duração (minutos)</Label>
                      <Input
                        id="lesson_duration"
                        type="number"
                        value={lessonForm.duration_minutes}
                        onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lesson_order">Ordem</Label>
                      <Input
                        id="lesson_order"
                        type="number"
                        value={lessonForm.order_index}
                        onChange={(e) => setLessonForm({ ...lessonForm, order_index: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lesson_free"
                      checked={lessonForm.is_free}
                      onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })}
                    />
                    <Label htmlFor="lesson_free">Aula Gratuita</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetLessonForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveLesson} disabled={saving}>
                    {saving ? "Salvando..." : editingLesson ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson) => {
                    const module = modules.find((m) => m.id === lesson.module_id)
                    return (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-sm text-muted-foreground">{lesson.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{module?.title || "Módulo não encontrado"}</TableCell>
                        <TableCell>{lesson.duration_minutes} min</TableCell>
                        <TableCell>
                          <Badge variant={lesson.is_free ? "default" : "secondary"}>
                            {lesson.is_free ? "Gratuita" : "Premium"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setLessonForm({
                                  module_id: lesson.module_id,
                                  title: lesson.title,
                                  description: lesson.description || "",
                                  video_url: lesson.video_url || "",
                                  content: lesson.content || "",
                                  duration_minutes: lesson.duration_minutes || 0,
                                  is_free: lesson.is_free,
                                  order_index: lesson.order_index,
                                })
                                setEditingLesson(lesson)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {lessons.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma aula encontrada. Crie sua primeira aula!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}