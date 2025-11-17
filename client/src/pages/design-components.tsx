import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArticleCard } from "@/components/shared/article-card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { DeleteButton } from "@/components/shared/delete-button";
import { PublishButton } from "@/components/dashboard/publish-button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/navbar";
import { Helmet } from "react-helmet-async";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  XCircle, 
  Loader2,
  Globe,
  Copy,
  ExternalLink,
  Edit,
  Trash2
} from "lucide-react";
import brevyHomeDesc1 from "@/assets/brevyhomedesc_1.webp";

export default function DesignComponents() {
  return (
    <>
      <Helmet>
        <title>Component Library - Brevy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Component Library</h1>
            <p className="text-lg text-gray-600">
              Documentation complète de tous les composants réutilisables de Brevy.
              Chaque composant a un nom unique pour faciliter les modifications.
            </p>
          </div>

          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="buttons">Boutons</TabsTrigger>
              <TabsTrigger value="forms">Formulaires</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            {/* BOUTONS */}
            <TabsContent value="buttons" className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ButtonPrimary</h2>
                <p className="text-gray-600 mb-4">Bouton principal avec fond bleu foncé (comme le CTA du hero et le bouton principal de la nav)</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Button Primary
                    </Button>
                    <Button variant="ghost">Button Ghost</Button>
                    <Button variant="destructive">Button Destructive</Button>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                      Small
                    </Button>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" size="default">
                      Default
                    </Button>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      Large
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" disabled>
                      Disabled
                    </Button>
                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      With Icon
                    </Button>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ButtonSecondary</h2>
                <p className="text-gray-600 mb-4">Bouton secondaire avec bordure bleue et fond clair (comme "Sign In" dans la nav et "View all articles" sur la home)</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      Button Secondary
                    </Button>
                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" size="sm">
                      Small
                    </Button>
                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" size="lg">
                      Large
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" disabled>
                      Disabled
                    </Button>
                    <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      With Icon
                    </Button>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">PublishButton</h2>
                <p className="text-gray-600 mb-4">Bouton de publication de CV avec gestion d'état</p>
                <div className="bg-white p-6 rounded-lg border">
                  <PublishButton 
                    cvId="example-cv-id" 
                    isPublished={false}
                    subdomain=""
                    publishedLanguage="en"
                    isLocked={false}
                  />
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">DeleteButton</h2>
                <p className="text-gray-600 mb-4">Bouton de suppression avec icône</p>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex gap-4">
                    <DeleteButton onClick={() => console.log("Delete")} />
                    <DeleteButton onClick={() => console.log("Delete")} size="md" />
                    <DeleteButton onClick={() => console.log("Delete")} size="lg" />
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* FORMULAIRES */}
            <TabsContent value="forms" className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">InputText</h2>
                <p className="text-gray-600 mb-4">Champ de saisie texte standard</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="input-default">Label</Label>
                    <Input id="input-default" placeholder="Placeholder text" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-disabled">Disabled</Label>
                    <Input id="input-disabled" placeholder="Disabled input" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="input-error">Error State</Label>
                    <Input id="input-error" placeholder="Error input" className="border-red-500" />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">TextareaField</h2>
                <p className="text-gray-600 mb-4">Zone de texte multiligne</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="textarea-default">Description</Label>
                    <Textarea 
                      id="textarea-default" 
                      placeholder="Enter your description here..."
                      rows={4}
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SelectDropdown</h2>
                <p className="text-gray-600 mb-4">Menu déroulant de sélection</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">CheckboxInput</h2>
                <p className="text-gray-600 mb-4">Case à cocher</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="checkbox-1" />
                    <Label htmlFor="checkbox-1" className="cursor-pointer">
                      Accept terms and conditions
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="checkbox-2" defaultChecked />
                    <Label htmlFor="checkbox-2" className="cursor-pointer">
                      Subscribe to newsletter
                    </Label>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SwitchToggle</h2>
                <p className="text-gray-600 mb-4">Interrupteur on/off</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="switch-1" className="cursor-pointer">
                      Enable notifications
                    </Label>
                    <Switch id="switch-1" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="switch-2" className="cursor-pointer">
                      Dark mode
                    </Label>
                    <Switch id="switch-2" defaultChecked />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">RadioGroupInput</h2>
                <p className="text-gray-600 mb-4">Groupe de boutons radio</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <Label>Select an option</Label>
                  <RadioGroup defaultValue="option1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="option1" />
                      <Label htmlFor="option1" className="cursor-pointer">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="option2" />
                      <Label htmlFor="option2" className="cursor-pointer">Option 2</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option3" id="option3" />
                      <Label htmlFor="option3" className="cursor-pointer">Option 3</Label>
                    </div>
                  </RadioGroup>
                </div>
              </section>
            </TabsContent>

            {/* CARDS */}
            <TabsContent value="cards" className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">CardContainer</h2>
                <p className="text-gray-600 mb-4">Conteneur de carte standard avec header, content, footer</p>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card description text goes here</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          This is the main content area of the card. You can put any content here.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Another Card</CardTitle>
                        <CardDescription>With different content</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600">
                          Cards are great for organizing information in a clean, structured way.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ArticleCard</h2>
                <p className="text-gray-600 mb-4">Carte d'article de blog avec image, titre et description</p>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ArticleCard
                      title="How to Create a Professional Resume in 2025"
                      description="Learn the best practices for creating a standout resume that gets you noticed by recruiters."
                      imageUrl={brevyHomeDesc1}
                      link="/blog/example"
                    />
                    <ArticleCard
                      title="Top 7 Best Resume Builder Tools"
                      description="Discover the most effective tools to create your professional resume online."
                      imageUrl={brevyHomeDesc1}
                      link="/blog/example"
                    />
                    <ArticleCard
                      title="Resume Website in 10 Minutes"
                      description="Create your own professional resume website quickly and easily with our guide."
                      imageUrl={brevyHomeDesc1}
                      link="/blog/example"
                    />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">BadgeLabel</h2>
                <p className="text-gray-600 mb-4">Badge pour étiquettes et statuts</p>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge className="bg-green-500">Success</Badge>
                    <Badge className="bg-yellow-500">Warning</Badge>
                    <Badge className="bg-blue-500">Info</Badge>
                  </div>
                </div>
              </section>
            </TabsContent>

            {/* FEEDBACK */}
            <TabsContent value="feedback" className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">AlertMessage</h2>
                <p className="text-gray-600 mb-4">Messages d'alerte avec variantes (success, error, warning, info)</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      This is an informational alert message. Use it to provide helpful context.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Your action was completed successfully!
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Warning</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                      Please review this information before proceeding.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Something went wrong. Please try again later.
                    </AlertDescription>
                  </Alert>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">LoadingSpinner</h2>
                <p className="text-gray-600 mb-4">Indicateur de chargement</p>
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex flex-wrap gap-8 items-center">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Small</p>
                      <LoadingSpinner size="sm" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Medium</p>
                      <LoadingSpinner size="md" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Large</p>
                      <LoadingSpinner size="lg" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">With Text</p>
                      <LoadingSpinner size="md" text="Loading..." />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ProgressBar</h2>
                <p className="text-gray-600 mb-4">Barre de progression</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>25%</span>
                    </div>
                    <Progress value={25} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>50%</span>
                    </div>
                    <Progress value={50} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SkeletonLoader</h2>
                <p className="text-gray-600 mb-4">Placeholder de chargement avec animation</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">ModalDialog</h2>
                <p className="text-gray-600 mb-4">Modal de dialogue</p>
                <div className="bg-white p-6 rounded-lg border">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Dialog Title</DialogTitle>
                        <DialogDescription>
                          This is a dialog description. It provides context about what the dialog is for.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-600">
                          Dialog content goes here. You can add any form elements or content.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </section>
            </TabsContent>

            {/* LAYOUT */}
            <TabsContent value="layout" className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">NavbarHeader</h2>
                <p className="text-gray-600 mb-4">Barre de navigation principale (déjà visible en haut)</p>
                <div className="bg-white p-6 rounded-lg border">
                  <p className="text-sm text-gray-600">
                    La navbar est déjà visible en haut de la page. Elle contient le logo, le sélecteur de langue, 
                    les boutons d'action et le menu utilisateur.
                  </p>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">TabsNavigation</h2>
                <p className="text-gray-600 mb-4">Navigation par onglets</p>
                <div className="bg-white p-6 rounded-lg border">
                  <Tabs defaultValue="tab1">
                    <TabsList>
                      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
                      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
                      <TabsTrigger value="tab3">Tab 3</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tab1" className="mt-4">
                      <p className="text-sm text-gray-600">Content for Tab 1</p>
                    </TabsContent>
                    <TabsContent value="tab2" className="mt-4">
                      <p className="text-sm text-gray-600">Content for Tab 2</p>
                    </TabsContent>
                    <TabsContent value="tab3" className="mt-4">
                      <p className="text-sm text-gray-600">Content for Tab 3</p>
                    </TabsContent>
                  </Tabs>
                </div>
              </section>

              <Separator />

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">SeparatorDivider</h2>
                <p className="text-gray-600 mb-4">Séparateur visuel</p>
                <div className="bg-white p-6 rounded-lg border space-y-4">
                  <p className="text-sm text-gray-600">Content above separator</p>
                  <Separator />
                  <p className="text-sm text-gray-600">Content below separator</p>
                </div>
              </section>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}

